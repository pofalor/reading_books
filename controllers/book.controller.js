const path = require('path');
const { Book, Author, Genre, BookGenre, ActionHistory } = require('../models');
const { cleanUpFiles } = require('../config/multer.config');

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
        const limit = parseInt(req.query.limit) || 10;
        const books = await Book.findAll({
            include: [
                { model: Author },
                { model: Genre, through: { attributes: [] } }
            ],
            limit: limit,
            order: [['createdAt', 'DESC']]
        });
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getBookById = async (req, res) => {
    try {
        const book = await Book.findByPk(req.params.id, {
            include: [
                { model: Author },
                { model: Genre, through: { attributes: [] } }
            ]
        });

        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        res.json(book);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createBook = async (req, res) => {
    try {
        const { title, description, pagesCount, authorId, genreIds } = req.body;

        // Обработка файла, если он был загружен
        const bookFile = req.file ? {
            path: req.file.path,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype
        } : null;

        const bookData = {
            title,
            description,
            pagesCount,
            authorId,
            fileUrl: bookFile ? `/uploads/books/${path.basename(bookFile.path)}` : null
        };

        const book = await Book.createBook(bookData);

        // Добавление жанров
        if (genreIds && genreIds.length) {
            await Promise.all(
                genreIds.map(genreId => BookGenre.addGenre(book.id, genreId))
            );
        }

        // Логирование действия
        if (req.user) {
            await ActionHistory.logAction(
                req.user.id,
                'AddBook',
                `Added book "${book.title}"`,
                null,
                null,
                book.id
            );
        }

        res.status(201).json(book);
    } catch (error) {
        // Очистка загруженных файлов в случае ошибки
        if (req.file) {
            cleanUpFiles({ bookFile: [req.file] });
        }
        res.status(400).json({ message: error.message });
    }
};

exports.updateBook = async (req, res) => {
    try {
        const book = await Book.findByPk(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        const updatedBook = await book.update(req.body);

        // Обновление жанров, если они переданы
        if (req.body.genreIds) {
            await BookGenre.destroy({ where: { bookId: book.id } });
            await Promise.all(
                req.body.genreIds.map(genreId =>
                    BookGenre.addGenre(book.id, genreId))
            );
        }

        // Логирование действия
        if (req.user) {
            await ActionHistory.logAction(
                req.user.id,
                'UpdateBook',
                `Updated book "${book.title}"`,
                null,
                book.id
            );
        }

        res.json(updatedBook);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteBook = async (req, res) => {
    try {
        const book = await Book.findByPk(req.params.id);
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

exports.uploadBookFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        res.json({
            success: true,
            filePath: `/uploads/books/${req.file.filename}`,
            originalName: req.file.originalname
        });
    } catch (error) {
        cleanUpFiles({ bookFile: [req.file] });
        res.status(500).json({ message: error.message });
    }
};

exports.getPendingBooks = async (req, res) => {
    try {
        const books = await Book.findAll({
            where: { isConfirmed: false },
            include: [ Author, Genre],
            limit: 100
        });

        if (books.length === 0) {
            return res.json({ hidden: true });
        }

        res.json(books);
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
