const { User, ActionHistory, Book, Author, Genre, Op, sequelize } = require('../models');

exports.getActionHistory = async (req, res) => {
    try {
        const { limit, beginDate, endDate, search } = req.body;

        // Определяем доступные типы действий в зависимости от роли
        const actionTypes = req.user.Roles.includes('moderator')
        ? [
            'AddBook', 'DeleteAuthor', 'DeleteBook', 'ApproveBook',
            'ApproveAuthor', 'AddGenre', 'DeleteGenre', 'AddBookGenre',
            'AddUserBook', 'RemoveUserBook'
        ] 
        // Админы видят все
        : undefined;

        const where = {
            ...(actionTypes && { actionType: { [Op.in]: actionTypes } }),
            ...(search && {
                [Op.or]: [
                    { actionType: sequelize.where(sequelize.fn('LOWER', sequelize.col('actionType')), 'LIKE', '%' + search + '%') },
                    { '$ActionHistory.description': sequelize.where(sequelize.fn('LOWER', sequelize.col('ActionHistory.description')), 'LIKE', '%' + search + '%') },
                    { '$Actor.email$': sequelize.where(sequelize.fn('LOWER', sequelize.col('Actor.email')), 'LIKE', '%' + search + '%') },
                    { '$Actor.firstName$': sequelize.where(sequelize.fn('LOWER', sequelize.col('Actor.firstName')), 'LIKE', '%' + search + '%') },
                    { '$Actor.lastName$': sequelize.where(sequelize.fn('LOWER', sequelize.col('Actor.lastName')), 'LIKE', '%' + search + '%') },
                    { '$User.email$': sequelize.where(sequelize.fn('LOWER', sequelize.col('User.email')), 'LIKE', '%' + search + '%') },
                    { '$User.firstName$': sequelize.where(sequelize.fn('LOWER', sequelize.col('User.firstName')), 'LIKE', '%' + search + '%') },
                    { '$Author.firstName$': sequelize.where(sequelize.fn('LOWER', sequelize.col('Author.firstName')), 'LIKE', '%' + search + '%') },
                    { '$User.lastName$': sequelize.where(sequelize.fn('LOWER', sequelize.col('User.lastName')), 'LIKE', '%' + search + '%') },
                    { '$Author.secondName$': sequelize.where(sequelize.fn('LOWER', sequelize.col('Author.secondName')), 'LIKE', '%' + search + '%') },
                    { '$Author.nickName$': sequelize.where(sequelize.fn('LOWER', sequelize.col('Author.nickName')), 'LIKE', '%' + search + '%') },
                    { '$Author.surname$': sequelize.where(sequelize.fn('LOWER', sequelize.col('Author.surname')), 'LIKE', '%' + search + '%') },
                    { '$Genre.name$': sequelize.where(sequelize.fn('LOWER', sequelize.col('Genre.name')), 'LIKE', '%' + search + '%') },
                    { '$Genre.description$': sequelize.where(sequelize.fn('LOWER', sequelize.col('Genre.description')), 'LIKE', '%' + search + '%') },
                    { '$Book.title$': sequelize.where(sequelize.fn('LOWER', sequelize.col('Book.title')), 'LIKE', '%' + search + '%') }
                ]
            })
        };

        // Добавляем фильтрацию по датам, если они переданы
        if (beginDate || endDate) {
            where.timestamp = {};
            if (beginDate) where.timestamp[Op.gte] = new Date(beginDate);
            if (endDate) where.timestamp[Op.lte] = new Date(endDate);
        }

         const history = await ActionHistory.findAll({
            where,
            include: [
                {
                    model: User,
                    as: 'Actor',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                },
                {
                    model: User,
                    as: 'User',
                    attributes: ['id', 'firstName', 'lastName', 'email'],
                    required: false
                },
                {
                    model: Author,
                    attributes: ['id', 'firstName', 'surname', 'nickName', 'secondName'],
                    required: false
                },
                {
                    model: Book,
                    attributes: ['id', 'title'],
                    required: false
                },
                {
                    model: Genre,
                    attributes: ['id', 'name'],
                    required: false
                }
            ],
            order: [['timestamp', 'DESC']],
            limit: parseInt(limit)
        });

        res.json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};