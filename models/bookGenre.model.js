const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    // Связь книги и жанра
    class BookGenre extends Model {

        static async addGenre(bookId, genreId, creatorId, transaction = null) {
            const exists = await this.findOne({ where: { bookId, genreId } });
            if (exists) {
                throw new Error('Жанр уже добавлен для книги.');
            }

            await sequelize.models.ActionHistory.logAction(
                creatorId,
                'AddBookGenre',
                `Книга: ${bookId} привязана к жанру: ${genreId}`,
                null,
                null,
                bookId,
                genreId,
                transaction
            );

            return this.create({ bookId, genreId }, { transaction });
        }

        static async removeGenre(bookId, genreId) {
            return this.destroy({ where: { bookId, genreId } });
        }

        static async getBookGenres(bookId) {
            return this.findAll({
                where: { bookId },
                include: [sequelize.models.Genre]
            });
        }
    }

    BookGenre.init({
        bookId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'books',
                key: 'id'
            }
        },
        genreId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'genres',
                key: 'id'
            }
        }
    }, {
        sequelize,
        modelName: 'BookGenre',
        tableName: 'book_genres',
        timestamps: false
    });

    return BookGenre;
};