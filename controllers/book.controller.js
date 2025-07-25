const path = require('path');
const { Book, Author, Genre, BookGenre, ActionHistory, sequelize } = require('../models');
const { cleanUpFiles } = require('../config/multer.config');
const fs = require('fs');

exports.getFeaturedBooks = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const books = await Book.getFeatured(limit);
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllBooks = async (req, res) => {
    try {
        const { body } = req.body;
        const limit = parseInt(body.limit) || 10;
        const search = body.search.toString().toLowerCase();
        const currentUserId = req.user.id; // Получаем ID текущего пользователя
        const books = await Book.findAll({
            where: sequelize.or(
                { title: sequelize.where(sequelize.fn('LOWER', sequelize.col('title')), 'LIKE', '%' + search + '%') },
                { "$Author.firstName$": sequelize.where(sequelize.fn('LOWER', sequelize.col("Author.firstName")), 'LIKE', '%' + search + '%') },
                { "$Author.secondName$": sequelize.where(sequelize.fn('LOWER', sequelize.col("Author.secondName")), 'LIKE', '%' + search + '%') },
                { "$Author.surname$": sequelize.where(sequelize.fn('LOWER', sequelize.col("Author.surname")), 'LIKE', '%' + search + '%') },
                { "$Author.nickName$": sequelize.where(sequelize.fn('LOWER', sequelize.col("Author.nickName")), 'LIKE', '%' + search + '%') },
                sequelize.literal(`EXISTS (
                        SELECT 1 FROM book_genres
                        JOIN genres ON genres.id = book_genres.genreId
                        WHERE book_genres.bookId = Book.id
                        AND LOWER(genres.name) LIKE '%${search}%'
                    )`)
            ),
            include: [
                {
                    model: Author,
                    where: {}, // Это нужно для правильной работы фильтрации
                    attributes: ['id', 'firstName', 'secondName', 'surname', 'nickName'],
                },
                {
                    model: Genre,
                    through: { attributes: [] }, // Исключаем промежуточную таблицу
                    attributes: ['name']
                }
            ],
            limit: limit,
            order: [
                [sequelize.literal(`CASE WHEN "creatorId" != '${currentUserId}' THEN 0 ELSE 1 END`), 'ASC'],
                ['isConfirmed', 'ASC'],
                ['createdAt', 'DESC']
            ],
            attributes: {
                exclude: ['updatedAt']
            },
            subQuery: false
        });
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createBook = async (req, res) => {
    let transaction;
    try {
        const { title, description, publicationDay, publicationMonth, publicationYear, price, isGuestAvailable, authorId, genres } = req.body;

        // Обработка файла, если он был загружен
        if (!req.file) {
            throw new Error('Файл книги обязателен');
        }

        transaction = await sequelize.transaction();

        // Обработка файла, если он был загружен
        const bookFile = {
            path: req.file.path,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype
        };

        const bookData = {
            title,
            description: description === 'null' ? null : description,
            publicationDay: publicationDay === 'null' ? null : publicationDay,
            publicationMonth: publicationMonth === 'null' ? null : publicationMonth,
            publicationYear: publicationYear === 'null' ? null : publicationYear,
            authorId: parseInt(authorId),
            price: price === '' ? null : price,
            guestAvailable: isGuestAvailable === 'true',
            creatorId: req.user.id,
            path: `/uploads/books/${path.basename(bookFile.path)}`
        };

        const book = await Book.create(bookData, { transaction });

        // Добавление жанров
        if (genres && genres.length) {
            await Promise.all(
                genres.split(',').map(genreId => BookGenre.addGenre(book.id, genreId, req.user.id, transaction))
            );
        }

        // Логирование действия
        await ActionHistory.logAction(
            req.user.id,
            'AddBook',
            `Добавлена книга "${book.title}"`,
            null,
            book.authorId,
            book.id,
            null,
            transaction
        );

        // Фиксируем транзакцию
        await transaction.commit();

        res.status(201).json(book);
    } catch (error) {
        if (transaction) await transaction.rollback();
        // Очистка загруженных файлов в случае ошибки
        if (req.file) {
            cleanUpFiles({ bookFile: [req.file] });
        }
        res.status(400).json({ message: error.message });
    }
};

exports.downloadBook = async (req, res) => {
    try {
        const { bookId } = req.query;
        const book = await Book.findByPk(bookId);

        if (!book) {
            throw new Error('Книга не найдена');
        }

        const filePath = path.join(__dirname, '..', book.path);

        // Проверяем, существует ли файл
        if (!fs.existsSync(filePath)) {
            throw new Error('Файл книги не найден');
        }

        // Определяем имя файла для скачивания
        const filename = path.basename(filePath);

        // Устанавливаем заголовки для скачивания
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/epub+zip');

        // Отправляем файл
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.deleteBook = async (req, res) => {
    try {
        const { bookId } = req.query;
        const book = await Book.findByPk(bookId);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        // Логирование перед удалением
        if (req.user) {
            await ActionHistory.logAction(
                req.user.id,
                'DeleteBook',
                `Deleted book "${book.title}"`,
                null,
                book.id
            );
        }

        await book.destroy();
        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.approveBook = async (req, res) => {
    try {
        const { bookId } = req.body;
        const book = await Book.findByPk(bookId);

        if (!book) throw new Error('Книга не найдена');
        if (book.creatorId === req.user.id) {
            throw new Error('Нельзя подтверждать свои собственные книги');
        }

        book.isConfirmed = true;
        await book.save();

        await ActionHistory.logAction(
            req.user.id,
            'ApproveBook',
            `Книга "${book.title}" подтверждена`,
            book.creatorId,
            book.authorId,
            book.id
        );

        res.json(book);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
