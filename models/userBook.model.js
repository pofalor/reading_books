const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    // Связь пользователя и книги
    class UserBook extends Model {

        static async updateReadingProgress(userId, bookId, currentPage) {
            const userBook = await this.findOne({ where: { userId, bookId } });
            if (!userBook) {
                console.error(`For user: ${userId} cannot find UserBook entity. BookId: ${bookId}`);
                return null;
            }

            userBook.currentPage = currentPage;

            // Если книга была на полке, меняем статус на "В процессе"
            if (userBook.status === 'OnShelf') {
                userBook.status = 'InProgress';
            }

            await userBook.save();
            return userBook;
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
        currentPage: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
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