const { Author, ActionHistory } = require('../models');

exports.getPendingAuthors = async (req, res) => {
    try {
        const authors = await Author.findAll({
            where: { isConfirmed: false },
            limit: 100
        });

        if (authors.length === 0) {
            return res.json({ hidden: true });
        }

        res.json(authors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.approveAuthor = async (req, res) => {
    try {
        const { authorId } = req.body;
        const author = await Author.findByPk(authorId);

        if (!author) throw new Error('Автор не найден');
        if (book.authorId === req.user.id) {
            throw new Error('Нельзя подтверждать своих собственных авторов');
        }

        author.isConfirmed = true;
        await author.save();

        await ActionHistory.logAction(
            req.user.id,
            'ApproveAuthor',
            `Автор "${author.getFullName()}" подтвержден`,
            author.creatorId,
            author.id,
            null
        );

        res.json(author);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};