const { User, ActionHistory, Book, Author, Genre, Op } = require('../models');

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
                    { actionType: { [Op.iLike]: `%${search}%` } },
                    { description: { [Op.iLike]: `%${search}%` } },
                    { '$Actor.email$': { [Op.iLike]: `%${search}%` } },
                    { '$Actor.firstName$': { [Op.iLike]: `%${search}%` } },
                    { '$Actor.lastName$': { [Op.iLike]: `%${search}%` } },
                    { '$User.email$': { [Op.iLike]: `%${search}%` } },
                    { '$User.firstName$': { [Op.iLike]: `%${search}%` } },
                    { '$User.lastName$': { [Op.iLike]: `%${search}%` } },
                    { '$Author.firstName$': { [Op.iLike]: `%${search}%` } },
                    { '$Author.secondName$': { [Op.iLike]: `%${search}%` } },
                    { '$Author.nickName$': { [Op.iLike]: `%${search}%` } },
                    { '$Author.surname$': { [Op.iLike]: `%${search}%` } },
                    { '$Genre.name$': { [Op.iLike]: `%${search}%` } },
                    { '$Genre.description$': { [Op.iLike]: `%${search}%` } },
                    { '$Book.title$': { [Op.iLike]: `%${search}%` } }
                ]
            })
        };

        // Добавляем фильтрацию по датам, если они переданы
        if (beginDate || endDate) {
            where.date = {};
            if (beginDate) where.date[Op.gte] = new Date(beginDate);
            if (endDate) where.date[Op.lte] = new Date(endDate);
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