const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    //Жанр
    class Genre extends Model {
        static async getAll(search = "", limit = 100) {
            const genres = await Genre.findAll({
                where: sequelize.or(
                    { name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), 'LIKE', '%' + search + '%') },
                    { description: sequelize.where(sequelize.fn('LOWER', sequelize.col('description')), 'LIKE', '%' + search + '%') }
                ),
                limit: limit
            });
            return genres;
        }

        static async getGenresWithBookCount(search = "", limit = 100) {
            const [results] = await sequelize.query(`
                SELECT 
                    g.id, 
                    g.name, 
                    g.description, 
                    COUNT(bg.bookId) as bookCount
                FROM genres g
                JOIN book_genres bg ON g.id = bg.genreId
                WHERE LOWER(g.name) LIKE ?
                GROUP BY g.id
                ORDER BY bookCount DESC
                LIMIT ?`,
                {
                    replacements: [`%${search.toLowerCase()}%`, limit]
                }
            );

            return results.map(item => ({
                ...item,
                bookCount: parseInt(item.bookCount) || 0
            }));
        }
    }

    Genre.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        description: {
            type: DataTypes.TEXT
        }
    }, {
        sequelize,
        modelName: 'Genre',
        tableName: 'genres',
        timestamps: false
    });

    return Genre;
};