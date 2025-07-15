const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Role extends Model {

        static async createNew(roleName, description) {
            return this.create({ name: roleName, description });
        }

        // Добавить в класс Role
        static async getAllRoles() {
            return this.findAll();
        }

        static async addRole(name, description, currentUserId) {
            const role = await this.create({ name, description });

            // Логируем действие
            await sequelize.models.ActionHistory.logAction(
                currentUserId,
                'AddRole',
                `Добавлена новая роль: ${name}`
            );

            return role;
        }

        static async deleteRole(name, currentUserId) {
            const role = await this.findOne({ where: { name } });
            if (!role) throw new Error('Role not found');

            // Проверяем, что роль не используется
            const count = await sequelize.models.UserRole.count({ where: { roleId: role.id } });
            if (count > 0) {
                throw new Error('Роль используется и не может быть удалена');
            }

            await role.destroy();

            // Логируем действие
            await sequelize.models.ActionHistory.logAction(
                currentUserId,
                'DeleteRole',
                `Удалена роль: ${name}`
            );

            return true;
        }
    }

    Role.init({
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
            type: DataTypes.STRING
        }
    }, {
        sequelize,
        modelName: 'Role',
        tableName: 'roles',
        timestamps: false
    });

    return Role;
};