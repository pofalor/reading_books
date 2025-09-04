const { Author, ActionHistory, sequelize } = require('../models');

exports.approveAuthor = async (req, res) => {
    try {
        const { authorId } = req.body;
        const author = await Author.findByPk(authorId);

        if (!author) throw new Error('Автор не найден');
        if (author.creatorId === req.user.id) {
            throw new Error('Нельзя подтверждать своих собственных авторов');
        }

        author.isConfirmed = true;
        await author.save();

        await ActionHistory.logAction(
            req.user.id,
            'ApproveAuthor',
            `Автор "${author.getFullName()}" подтвержден`,
            author.creatorId,
            author.id
        );

        res.json(author);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getAllAuthors = async (req, res) => {
    try {
        const { body } = req.body;
        const limit = parseInt(body.limit) || 100;
        const search = body.search.toString().toLowerCase();
        const currentUserId = req.user.id; // Получаем ID текущего пользователя
        const authors = await Author.findAll({
            where: sequelize.or(
                { firstName: sequelize.where(sequelize.fn('LOWER', sequelize.col('firstName')), 'LIKE', '%' + search + '%') },
                { secondName: sequelize.where(sequelize.fn('LOWER', sequelize.col('secondName')), 'LIKE', '%' + search + '%') },
                { surname: sequelize.where(sequelize.fn('LOWER', sequelize.col('surname')), 'LIKE', '%' + search + '%') },
                { nickName: sequelize.where(sequelize.fn('LOWER', sequelize.col('nickName')), 'LIKE', '%' + search + '%') },
            ),
            limit: limit,
            order: [
                ['isConfirmed', 'ASC'],
                [sequelize.literal(`CASE WHEN Author.creatorId != ${currentUserId} THEN 0 ELSE 1 END`), 'ASC'],
                ['createdAt', 'DESC']]
        });

        if (authors.length === 0) {
            return res.json({ hidden: true });
        }

        res.json(authors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.searchApproved = async (req, res) => {
    try {
        const { body } = req.body;
        const limit = parseInt(body.limit) || 100;
        const search = body.search.toString().toLowerCase();
        const authors = await Author.findAll({
            where: sequelize.or(
                { firstName: sequelize.where(sequelize.fn('LOWER', sequelize.col('firstName')), 'LIKE', '%' + search + '%') },
                { secondName: sequelize.where(sequelize.fn('LOWER', sequelize.col('secondName')), 'LIKE', '%' + search + '%') },
                { surname: sequelize.where(sequelize.fn('LOWER', sequelize.col('surname')), 'LIKE', '%' + search + '%') },
                { nickName: sequelize.where(sequelize.fn('LOWER', sequelize.col('nickName')), 'LIKE', '%' + search + '%') },
            ),
            where: {
                isConfirmed: true 
            },
            limit: limit,
            order: [['createdAt', 'DESC']]
        });

        res.json(authors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createNew = async (req, res) => {
    try {
        const model = req.body;
        model.creatorId = req.user.id;
        const author = await Author.createNew(model);
        res.json(author);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const { authorId } = req.query;
        const userId = req.user.id;
        const author = await Author.deleteAuthor(authorId, userId);
        res.json(author);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};