const { UserBook, ActionHistory, Book, Transaction, sequelize } = require('../models');

exports.addToShelf = async (req, res) => {
    let transaction;
    try {
        const { bookId } = req.query;
        const userId = req.user.id;

        if(!userId){
            throw new Error('Для добавления на книжную полку необходимо авторизоваться');
        }
        
        const book = await Book.findByPk(bookId);

        if (!book) {
            throw new Error('Книга не найдена');
        }

        const exists = await UserBook.findOne({ 
            where: { 
                bookId, 
                userId, 
                status: ['OnShelf', 'InProgress'] 
            } 
        });
        if (exists) {
            throw new Error('Книга уже добавлена на полку');
        }

        transaction = await sequelize.transaction();

        const [userBook, created] = await UserBook.upsert({
            userId,
            bookId,
            status: 'OnShelf'
        }, { returning: true }, { transaction });

        // Логирование перед удалением
        await ActionHistory.logAction(
            req.user.id,
            'AddUserBook',
            `Пользователь ${req.user.email} добавил книгу "${book.title}" на книжную полку`,
            null,
            book.authorId,
            bookId,
            null,
            transaction
        );

        await transaction.commit();
        res.json(userBook);

    } catch (error) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ message: error.message });
    }
};

exports.removeFromShelf = async (req, res) => {
    let transaction;
    try {
        const { bookId } = req.query;
        const userId = req.user.id;

        transaction = await sequelize.transaction();

        const book = await Book.findByPk(bookId);

        if (!book) {
            throw new Error('Книга не найдена');
        }

        // Находим запись о книге пользователя
        const userBook = await UserBook.findOne({
            where: {
                userId,
                bookId
            },
            transaction
        });

        if (!userBook) {
            throw new Error('Книга не найдена на полке пользователя');
        }

        // Обновляем статус на "Deleted"
        await userBook.update({
            status: 'Deleted'
        }, { transaction });

        // Логирование действия
        await ActionHistory.logAction(
            req.user.id,
            'RemoveUserBook',
            `Пользователь ${req.user.email} удалил книгу "${book.title}" с книжной полки`,
            null,
            book.authorId,
            bookId,
            null,
            transaction
        );

        await transaction.commit();
        res.json({ message: 'Книга успешно удалена с полки' });

    } catch (error) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ message: error.message });
    }
};