const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    // Транзакция
    class Transaction extends Model {
        static async processPayment(userId, bookId, amount) {
            return this.create({
                userId,
                bookId,
                type: 'PURCHASE',
                amount,
                status: 'COMPLETED'
            });
        }

        static async refund(transactionId) {
            const transaction = await this.findByPk(transactionId);
            if (!transaction) {
                throw new Error('Transaction not found');
            }
            if (transaction.status !== 'COMPLETED') {
                throw new Error('Only completed transactions can be refunded');
            }
            return transaction.update({ status: 'FAILED' });
        }
    }

    Transaction.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        bookId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'books',
                key: 'id'
            }
        },
        type: {
            type: DataTypes.ENUM('PURCHASE'),
            defaultValue: 'PURCHASE'
        },
        amount: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        status: {
            type: DataTypes.ENUM('COMPLETED', 'FAILED', 'PENDING'),
            defaultValue: 'PENDING'
        }
    }, {
        sequelize,
        modelName: 'Transaction',
        tableName: 'transactions',
        timestamps: false
    });

    return Transaction;
};