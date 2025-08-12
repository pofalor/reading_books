const { Book, Genre, Author, Transaction } = require('../models');

// Проверка прав для чтения книги
const attachBookToRequest = async (req, res, next) => {
    try {
        const { bookId } = req.query;
        const userId = req.user?.id ?? null;
        if (bookId) {
            const book = await Book.findByPk(bookId, {
                include: [
                    {
                        model: Author,
                        attributes: ['id', 'firstName', 'secondName', 'surname', 'nickName'],
                    },
                    {
                        model: Genre,
                        through: { attributes: [] }, // Исключаем промежуточную таблицу
                        attributes: ['name']
                    },
                    {
                        model: Transaction,
                        where: {
                            bookId: bookId,
                            userId: userId,
                            status: 'COMPLETED',
                            type: 'PURCHASE'
                        },
                        required: false,
                        attributes: ['id']
                    }]
            });

            if (!book) {
                return res.status(404).send('Книга не найдена');
            }

            // Проверка доступа
            if (!book.guestAvailable && !req.user) {
                return res.status(401).render('error-401', {
                    title: 'Ошибка 401',
                    errorTitle: 'Доступ запрещен',
                    needLoginButton: true,
                    needRegisterButton: true,
                    errorMessage: `Для просмотра этой страницы необходимо авторизоваться. 
                    Пожалуйста, войдите в систему или зарегистрируйтесь.`
                });
            }

            //если книга платная, то нужно проверить куплена ли она
            if (book.price && !book.Transactions.some()) {
                return res.status(401).render('error-401', {
                    title: 'Ошибка 401',
                    errorTitle: 'Доступ запрещен',
                    errorMessage: `Для того, чтобы читать эту книгу, необходимо её купить.`,
                    needAdditionalButton: true,
                    addButtonHref: `/purchase/${book.id}`,
                    addButtonClass: "btn accent",
                    addButtonText: `Купить за ${book.price.toFixed(2)} ₽`,
                    addButtonIcon: "fas fa-cart-shopping"
                });
            }

            req.book = book;
        }
    } catch (error) {
        console.error('Error in book middleware: ', error);
    }
    next();
};

module.exports = { attachBookToRequest };