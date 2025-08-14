const { Book, Transaction, UserBook, Author } = require('../models');

exports.getPurchasePage = async (req, res) => {
    try {
        const { bookId } = req.query;
        const book = await Book.findByPk(bookId, {
            include: [
                {
                    model: Author,
                    attributes: ['id', 'firstName', 'secondName', 'surname', 'nickName'],
                }
            ],
            attributes: {
                exclude: ['updatedAt']
            },
        });

        if (!book) {
            return res.status(404).json({ message: 'Книга не найдена' });
        }

        if (!book.price || book.price <= 0) {
            return res.redirect(`/book?bookId=${bookId}`);
        }

        res.render('purchase', { book, user: req.user });
    } catch (error) {
        console.error('Ошибка при загрузке страницы покупки:', error);
        res.status(500).json({ message: error.message || 'Ошибка при загрузке страницы' });
    }
};

exports.processPayment = async (req, res) => {
    try {
        const { bookId } = req.body;
        const userId = req.user.id;
        const book = await Book.findByPk(bookId);

        if (!book) {
            return res.status(404).json({ success: false, message: 'Книга не найдена' });
        }

        const status = 'COMPLETED';
        const type = 'PURCHASE';

        const existTrans = await Transaction.findOne({ where: { bookId, userId, status, type } });
        if (existTrans)  return res.status(404).json({ success: false, message: 'Книга уже куплена' });

        // Создаем транзакцию
        const transaction = await Transaction.create({
            userId,
            bookId,
            amount: book.price,
            status: 'PENDING',
            type
        });

        // Имитация платежа (90% успешных)
        const isSuccess = Math.random() < 0.9;

        // Обновляем статус транзакции
        transaction.status = isSuccess ? 'COMPLETED' : 'FAILED';
        await transaction.save();

        if (isSuccess) {
            // Добавляем книгу пользователю
            await UserBook.findOrCreate({
                where: { userId, bookId },
                defaults: {
                    userId,
                    bookId,
                    status: 'OnShelf'
                }
            });
        }

        res.json({
            success: isSuccess,
            transactionId: transaction.id,
            status: transaction.status
        });

    } catch (error) {
        console.error('Ошибка при обработке платежа:', error);
        res.status(500).json({ success: false, message: error.message || 'Ошибка при обработке платежа' });
    }
};