const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    //Жанр
    class Genre extends Model {
        static async createGenre(name, description) {
            return this.create({ name, description });
        }

        static async editGenre(genreId, editModel) {
            const genre = await this.findByPk(genreId);
            if (!genre) {
                throw new Error('Genre not found');
            }
            return genre.update(editModel);
        }

        static async getAll() {
            return await this.findAll();
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