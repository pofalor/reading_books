const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    //Связь пользователя и роли
    class UserRole extends Model {
        static async assignToUser(userId, roleId) {
            const exists = await this.hasUserRole(userId, roleId);
            if (exists) {
                throw new Error('У пользователя уже есть эта роль');
            }
            return this.create({ userId, roleId });
        }

        static async hasUserRole(userId, roleId) {
            const count = await this.count({ where: { userId, roleId } });
            return count > 0;
        }

        static async removeFromUser(userId, roleId) {
            return this.destroy({ where: { userId, roleId } });
        }
    }

    UserRole.init({
        userId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        roleId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'roles',
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
        modelName: 'UserRole',
        tableName: 'user_roles',
        timestamps: false
    });

    return UserRole;
};