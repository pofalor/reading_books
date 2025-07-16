const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    // Автор
    class Author extends Model {
        static async createNew(authorData) {
            return this.create(authorData);
        }

        static async deleteAuthor(authorId) {
            const author = await this.findByPk(authorId);
            if (!author) {
                throw new Error('Author not found');
            }
            return author.destroy();
        }

        getFullName() {
            return `${this.firstName} ${this.secondName ? this.secondName + ' ' : ''}${this.surname}`;
        }
    }

    Author.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        secondName: {
            type: DataTypes.STRING
        },
        surname: {
            type: DataTypes.STRING,
        },
        nickName: {
            type: DataTypes.STRING
        },
        birthDate: {
            type: DataTypes.DATEONLY
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        isConfirmed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        creatorId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'users',
                key: 'id'
            },
            allowNull: false
        },
    }, {
        sequelize,
        modelName: 'Author',
        tableName: 'authors',
        timestamps: false
    });

    return Author;
};