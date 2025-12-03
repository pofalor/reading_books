const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    // Транзакция
    class Transaction extends Model {
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
        timestamps: true
    });

    return Transaction;
};