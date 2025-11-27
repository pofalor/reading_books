const { Book, Author, Genre, BookGenre, ActionHistory, sequelize } = require('../models');


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
            genres 
        } = req.body;

        // Валидация обязательных полей
        if (!id) {
            throw new Error('ID книги обязателен');
        }

        if (!title) {
            throw new Error('Название книги обязательно');
        }

        if (!authorId) {
            throw new Error('Автор обязателен');
        }

        if (!genres || !Array.isArray(genres) || genres.length === 0) {
            throw new Error('Необходимо выбрать хотя бы один жанр');
        }

        transaction = await sequelize.transaction();

        // Находим книгу
        const book = await Book.findByPk(id, { transaction });
        if (!book) {
            throw new Error('Книга не найдена');
        }

        // Проверяем права на редактирование (только создатель или админ)
        if (book.creatorId !== req.user.id && req.user.role !== 'admin') {
            throw new Error('Недостаточно прав для редактирования этой книги');
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
            authorId: book.authorId
        };

        // Обновляем данные книги
        const updateData = {
            title,
            description: description || null,
            publicationDay: publicationDay || null,
            publicationMonth: publicationMonth || null,
            publicationYear: publicationYear || null,
            authorId: parseInt(authorId),
            price: price === '' ? null : parseFloat(price),
            guestAvailable: guestAvailable === true || guestAvailable === 'true'
        };

        await book.update(updateData, { transaction });

        // Обновляем жанры
        const currentGenres = await BookGenre.findAll({ 
            where: { bookId: id },
            transaction 
        });
        
        const currentGenreIds = currentGenres.map(g => g.genreId);
        const newGenreIds = genres.map(g => parseInt(g));

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
            `Книга "${oldValues.title}" обновлена`,
            JSON.stringify(oldValues),
            book.authorId,
            book.id,
            null,
            transaction
        );

        await transaction.commit();

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
        if (transaction) await transaction.rollback();
        console.error('Error updating book:', error);
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
        if (!id) {
            throw new Error('ID автора обязателен');
        }

        if (!nickName) {
            throw new Error('Псевдоним автора обязателен');
        }

        transaction = await sequelize.transaction();

        // Находим автора
        const author = await Author.findByPk(id, { transaction });
        if (!author) {
            throw new Error('Автор не найден');
        }

        // Проверяем права на редактирование (только создатель или админ)
        if (author.creatorId !== req.user.id && req.user.role !== 'admin') {
            throw new Error('Недостаточно прав для редактирования этого автора');
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
            bio: author.bio
        };

        // Обновляем данные автора
        const updateData = {
            firstName: firstName || null,
            secondName: secondName || null,
            surname: surname || null,
            nickName,
            birthDate: birthDate || null,
            bio: bio || null
        };

        await author.update(updateData, { transaction });

        // Логирование действия
        await ActionHistory.logAction(
            req.user.id,
            'UpdateAuthor',
            `Автор "${oldValues.nickName}" обновлен`,
            JSON.stringify(oldValues),
            author.id,
            null,
            null,
            transaction
        );

        await transaction.commit();

        res.json(author);
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Error updating author:', error);
        res.status(400).json({ message: error.message });
    }
};

exports.updateGenre = async (req, res) => {
    let transaction;
    try {
        const { id, name, description } = req.body;

        // Валидация обязательных полей
        if (!id) {
            throw new Error('ID жанра обязателен');
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
            `Жанр "${oldValues.name}" обновлен`,
            JSON.stringify(oldValues),
            null,
            null,
            genre.id,
            transaction
        );

        await transaction.commit();

        res.json(genre);
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Error updating genre:', error);
        res.status(400).json({ message: error.message });
    }
};