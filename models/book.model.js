const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    //Книга
    class Book extends Model {
        static async createBook(bookData) {
            return this.create(bookData);
        }

        static async deleteBook(bookId) {
            const book = await this.findByPk(bookId);
            if (!book) {
                throw new Error('Book not found');
            }
            return book.destroy();
        }

        static async getFeatured(limit = 10) {
            return this.findAll({
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                include: [
                    {
                        model: sequelize.models.Author,
                        attributes: ['id', 'firstName', 'secondName', 'surname', 'nickName']
                    },
                    {
                        model: sequelize.models.Genre,
                        through: { attributes: [] }, // Исключаем промежуточную таблицу
                        attributes: ['id', 'name']
                    }
                ],
                attributes: {
                    exclude: ['updatedAt'] // Исключаем ненужные поля
                }
            });
        }
    }

    Book.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        isConfirmed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        publicationDate: {
            type: DataTypes.DATEONLY
        },
        description: {
            type: DataTypes.TEXT
        },
        pagesCount: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        authorId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'authors',
                key: 'id'
            }
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'Book',
        tableName: 'books',
        timestamps: false
    });

    return Book;
};