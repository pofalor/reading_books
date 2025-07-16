const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ActionHistory extends Model {
        static async logAction(actorId, actionType, description, userId = null, authorId = null, bookId = null, genreId = null) {
            return this.create({
                actionType,
                description,
                actorId,
                userId,
                authorId,
                bookId,
                genreId
            });
        }

        static async getActionsByUser(userId) {
            return this.findAll({ where: { userId } });
        }
    }

    ActionHistory.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        actionType: {
            type: DataTypes.ENUM('AddAuthor', 
                'AddBook', 
                'DeleteAuthor', 
                'DeleteBook', 
                'AddRole',
                'DeleteRole',
                'AddRoleToUser',
                'RemoveRoleFromUser',
                'ApproveBook',
                'ApproveAuthor',
                'AddGenre',
                'DeleteGenre'),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        timestamp: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        actorId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'users',
                key: 'id'
            },
            allowNull: false
        },
        userId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'users',
                key: 'id'
            },
            allowNull: true
        },
        authorId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'authors',
                key: 'id'
            },
            allowNull: true
        },
        bookId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'books',
                key: 'id'
            },
            allowNull: true
        },
        genreId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'genres',
                key: 'id'
            },
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'ActionHistory',
        tableName: 'action_history',
        timestamps: false
    });

    return ActionHistory;
};