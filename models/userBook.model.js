const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    // Связь пользователя и книги
    class UserBook extends Model {
        
        static async changeStatus(userId, bookId, newStatus) {
            const userBook = await this.findOne({ where: { userId, bookId } });
            if (!userBook) {
                throw new Error('Book not found in user collection');
            }
            return userBook.update({ status: newStatus });
        }

        static async markAsRead(userId, bookId) {
            const userBook = await this.findOne({ where: { userId, bookId } });
            if (!userBook) {
                throw new Error('Book not found in user collection');
            }
            return userBook.update({ status: 'OnShelf', lastPage: 0 });
        }

        static async addToFavorites(userId, bookId) {
            const [userBook, created] = await this.findOrCreate({
                where: { userId, bookId },
                defaults: { status: 'OnShelf' }
            });
            return userBook;
        }

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
        },
        lastPage: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        sequelize,
        modelName: 'UserBook',
        tableName: 'user_books',
        timestamps: false
    });

    return UserBook;
};