const { Book, Author, Genre, Op, sequelize } = require('../models');

exports.searchBooks = async (req, res) => {
   try {
        const { title, author, genres, limit} = req.body;

        const where = {
            isConfirmed: true
        };

        const include = [];

        // Фильтр по названию книги
        if (title) {
            where.title = sequelize.where(sequelize.fn('LOWER', sequelize.col('title')), 'LIKE', '%' + title + '%');
        }

        // Фильтр по автору
        if (author) {
            include.push({
                model: Author,
                where: {
                    [Op.or]: [
                        { "$Author.firstName$": sequelize.where(sequelize.fn('LOWER', sequelize.col('Author.firstName')), 'LIKE', '%' + author + '%') },
                        { "$Author.secondName$": sequelize.where(sequelize.fn('LOWER', sequelize.col('Author.secondName')), 'LIKE', '%' + author + '%') },
                        { "$Author.secondName$": sequelize.where(sequelize.fn('LOWER', sequelize.col('Author.secondName')), 'LIKE', '%' + author + '%') },
                        { "$Author.nickName$": sequelize.where(sequelize.fn('LOWER', sequelize.col('Author.nickName')), 'LIKE', '%' + author + '%') },
                    ]
                },
                required: true
            });
        } else {
            include.push({
                model: Author,
                required: true
            });
        }


        // Добавляем жанры всегда (без фильтрации в самой ассоциации)
        include.push({
            model: Genre,
            through: { attributes: [] }
        });
        // Фильтр по жанрам - добавляем отдельное условие для фильтрации книг
        if (genres) {
            const genreIds = genres.split(',').map(id => parseInt(id));
            
            // Добавляем подзапрос для фильтрации книг по жанрам
            where.id = {
                [Op.in]: sequelize.literal(`(
                    SELECT bg.bookId FROM book_genres bg
                    WHERE bg.genreId IN (${genreIds.join(',')})
                )`)
            };
        }

        const books = await Book.findAll({
            where,
            include,
            distinct: true,
            limit: limit,
            order: [['createdAt', 'DESC']]
        });

        res.json(books);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};