const { UserBook, Book, Author, Genre } = require('../models');

exports.getMyBooksPage = async (req, res) => {
    try {
        const userId = req.user.id;

        const userBooks = await UserBook.findAll({
            where: {
                userId,
                status: ['OnShelf', 'InProgress'] // Только активные книги
            },
            include: [{
                model: Book,
                include: [
                    { model: Author },
                    { model: Genre, through: { attributes: [] } }
                ],
                where: { isConfirmed: true }
            }],
            order: [
                ['lastUpdated', 'DESC'] // Новые сверху
            ]
        });

        res.render('my-books', {
            title: 'Мои книги',
            user: req.user,
            books: userBooks.map(ub => ({
                ...ub.Book.get(),
                status: ub.status,
                currentPage: ub.currentPage,
                lastUpdated: ub.lastUpdated
            }))
        });
    } catch (error) {
        console.error('Ошибка при загрузке страницы "Мои книги":', error);
        res.status(500).json({ message: error.message });
    }
};