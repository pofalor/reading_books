const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    // Связь пользователя и книги
    class UserBook extends Model {

        static async getFavoriteBooks(userId) {
            return this.findAll({
                where: { userId },
                include: [sequelize.models.Book]
            });
        }
    }

    UserBook.init({
        userId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        bookId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'books',
                key: 'id'
            }
        },
        status: {
            type: DataTypes.ENUM('OnShelf', 'InProgress', 'Deleted'),
            defaultValue: 'OnShelf'
        },
        addedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        lastUpdated: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'UserBook',
        tableName: 'user_books',
        timestamps: false,
        hooks: {
            beforeUpdate: (instance) => {
                instance.lastUpdated = new Date();
            }
        }
    });

    return UserBook;
};