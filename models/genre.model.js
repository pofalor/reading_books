const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    //Жанр
    class Genre extends Model {
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