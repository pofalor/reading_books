const path = require('path');
const { Book, Author, Genre, BookGenre, ActionHistory, sequelize } = require('../models');
const { cleanUpFiles, deleteFile, toCoverPath, coverFsPath } = require('../config/multer.config');

//TODO: перенести сюда все методы, которые относятся к странице модерации
exports.updateBook = async (req, res) => {
    let transaction;
    try {
        const { 
            id, 
            title, 
            description, 
            publicationDay, 
            publicationMonth, 
            publicationYear, 
            price, 
            guestAvailable, 
            authorId, 
            genres,
            removeCover
        } = req.body;
        const bookFile = req.files?.file?.[0];
        const coverFile = req.files?.cover?.[0];

        if (!authorId || authorId === 'null') {
            throw new Error('Автор обязателен');
        }

        // Валидация обязательных полей
        if (!id || id === 'null') {
            throw new Error('Системная ошибка: не удалось найти Id книги. Пожалуйста, обратитесь в поддержку');
        }

        if (!title) {
            throw new Error('Название книги обязательно');
        }

        // Один выбранный жанр multer отдаёт строкой, несколько — массивом
        const genreList = [].concat(genres ?? []).filter(g => g && g !== 'null');
        if (genreList.length === 0) {
            throw new Error('Необходимо выбрать хотя бы один жанр');
        }

        transaction = await sequelize.transaction();

        // Находим книгу
        const book = await Book.findByPk(id, { transaction });
        if (!book) {
            throw new Error('Системная ошибка: книга не найдена. Пожалуйста, обратитесь в поддержку ');
        }

        // Сохраняем старые значения для лога
        const oldValues = {
            title: book.title,
            description: book.description,
            publicationDay: book.publicationDay,
            publicationMonth: book.publicationMonth,
            publicationYear: book.publicationYear,
            price: book.price,
            guestAvailable: book.guestAvailable,
            authorId: book.authorId,
            isConfirmed: book.isConfirmed,
            path: book.path,
            coverPath: book.coverPath
        };

        // Обновляем данные книги
        const bookData = {
            title,
            description: description === 'null' ? null : description,
            publicationDay: publicationDay === 'null' ? null : publicationDay,
            publicationMonth: publicationMonth === 'null' ? null : publicationMonth,
            publicationYear: publicationYear === 'null' ? null : publicationYear,
            authorId: parseInt(authorId),
            price: price === '' ? null : price,
            guestAvailable: guestAvailable === 'true',
            isConfirmed: false
        };

        // Заменённые файлы удаляем только после коммита: если транзакция
        // откатится, книга должна остаться со своими прежними файлами.
        const replacedFiles = [];

        if (bookFile) {
            bookData.path = `/uploads/books/${bookFile.filename}`;
            if (book.path) replacedFiles.push(path.join(__dirname, '..', book.path));
        }

        // Новая обложка заменяет старую; removeCover без файла — вернуть стандартную
        if (coverFile || removeCover === 'true') {
            bookData.coverPath = coverFile ? toCoverPath(coverFile) : null;
            if (book.coverPath) replacedFiles.push(coverFsPath(book.coverPath));
        }

        await book.update(bookData, { transaction });

        // Обновляем жанры
        const currentGenres = await BookGenre.findAll({ 
            where: { bookId: id },
            transaction 
        });
        
        const currentGenreIds = currentGenres.map(g => g.genreId);
        const newGenreIds = genreList.map(g => parseInt(g));

        // Жанры для удаления
        const genresToRemove = currentGenreIds.filter(id => !newGenreIds.includes(id));
        if (genresToRemove.length > 0) {
            await BookGenre.destroy({
                where: {
                    bookId: id,
                    genreId: genresToRemove
                },
                transaction
            });

            // Логирование действия
            await ActionHistory.logAction(
                req.user.id,
                'RemoveBookGenres',
                `Жанры "${genresToRemove}" у книги удалены. Старое имя книги: "${oldValues.title}". 
                Новое имя книги: "${bookData.title}"`,
                null,
                book.authorId,
                book.id,
                null,
                transaction
            );
        }

        // Жанры для добавления
        const genresToAdd = newGenreIds.filter(id => !currentGenreIds.includes(id));
        if (genresToAdd.length > 0) {
            await Promise.all(
                genresToAdd.map(genreId =>
                    BookGenre.addGenre(id, genreId, req.user.id, transaction)
                )
            );
        }

        // Логирование действия
        await ActionHistory.logAction(
            req.user.id,
            'UpdateBook',
            `Книга обновлена. Старые значения: ${JSON.stringify(oldValues)}. Новые значения: ${JSON.stringify(bookData)}`,
            null,
            book.authorId,
            book.id,
            null,
            transaction
        );

        await transaction.commit();
        replacedFiles.forEach(deleteFile);

        // Получаем обновленную книгу с связанными данными
        const updatedBook = await Book.findByPk(id, {
            include: [
                {
                    model: Author,
                    attributes: ['id', 'firstName', 'secondName', 'surname', 'nickName']
                },
                {
                    model: Genre,
                    through: { attributes: [] },
                    attributes: ['id', 'name']
                }
            ]
        });

        res.json(updatedBook);
    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        // Изменения не сохранились — новые файлы не нужны
        if (transaction?.finished !== 'commit') {
            cleanUpFiles(req.files);
        }
        console.error('Error updating book: ', error);
        res.status(400).json({ message: error.message });
    }
};

exports.updateAuthor = async (req, res) => {
    let transaction;
    try {
        const { 
            id, 
            firstName, 
            secondName, 
            surname, 
            nickName, 
            birthDate, 
            bio 
        } = req.body;

        // Валидация обязательных полей
        if (!id || id === 'null') {
            throw new Error('Системная ошибка: не удалось найти Id автора. Пожалуйста, обратитесь в поддержку');
        }

        if (!nickName) {
            throw new Error('Псевдоним автора обязателен');
        }

        transaction = await sequelize.transaction();

        // Находим автора
        const author = await Author.findByPk(id, { transaction });
        if (!author) {
            throw new Error('Системная ошибка: не удалось найти автора. Пожалуйста, обратитесь в поддержку');
        }

        // Проверяем уникальность псевдонима
        if (nickName !== author.nickName) {
            const existingAuthor = await Author.findOne({ 
                where: { nickName },
                transaction 
            });
            if (existingAuthor) {
                throw new Error('Автор с таким псевдонимом уже существует');
            }
        }

        // Сохраняем старые значения для лога
        const oldValues = {
            firstName: author.firstName,
            secondName: author.secondName,
            surname: author.surname,
            nickName: author.nickName,
            birthDate: author.birthDate,
            bio: author.bio,
            isConfirmed: author.isConfirmed,
            createdAt: author.createdAt,
            creatorId: author.creatorId
        };

        // Обновляем данные автора
        const updateData = {
            firstName: firstName || null,
            secondName: secondName || null,
            surname: surname || null,
            nickName,
            birthDate: birthDate || null,
            bio: bio || null, 
            isConfirmed: false
        };

        await author.update(updateData, { transaction });

        // Логирование действия
        await ActionHistory.logAction(
            req.user.id,
            'UpdateAuthor',
            `Автор обновлен. Старые значения: ${JSON.stringify(oldValues)}. Новые значения: ${JSON.stringify(updateData)}`,
            null,
            author.id,
            null,
            null,
            transaction
        );

        await transaction.commit();

        res.json(author);
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Error updating author: ', error);
        res.status(400).json({ message: error.message });
    }
};

exports.updateGenre = async (req, res) => {
    let transaction;
    try {
        const { id, name, description } = req.body;

        // Валидация обязательных полей
        if (!id || id === 'null') {
            throw new Error('Системная ошибка: ID жанра обязателен. Пожалуйста, обратитесь в поддержку');
        }

        if (!name) {
            throw new Error('Название жанра обязательно');
        }

        transaction = await sequelize.transaction();

        // Находим жанр
        const genre = await Genre.findByPk(id, { transaction });
        if (!genre) {
            throw new Error('Жанр не найден');
        }

        // Проверяем уникальность названия
        if (name !== genre.name) {
            const existingGenre = await Genre.findOne({ 
                where: { name },
                transaction 
            });
            if (existingGenre) {
                throw new Error('Жанр с таким названием уже существует');
            }
        }

        // Сохраняем старые значения для лога
        const oldValues = {
            name: genre.name,
            description: genre.description
        };

        // Обновляем данные жанра
        const updateData = {
            name,
            description: description || null
        };

        await genre.update(updateData, { transaction });

        // Логирование действия
        await ActionHistory.logAction(
            req.user.id,
            'UpdateGenre',
            `Жанр обновлен. Старые значения: ${JSON.stringify(oldValues)}. Новые значения: ${JSON.stringify(updateData)}`,
            null,
            null,
            null,
            genre.id,
            transaction
        );

        await transaction.commit();

        res.json(genre);
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Error updating genre: ', error);
        res.status(400).json({ message: error.message });
    }
};