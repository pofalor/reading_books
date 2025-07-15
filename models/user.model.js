const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes, Sequelize) => {
    class User extends Model {

        static async register(email, password, firstName, lastName) {
            const passwordHash = await bcrypt.hash(password, 10);
            return this.create({ email, passwordHash, firstName, lastName });
        }

        static async login(email, password) {
            const user = await this.findOne({
                where: { email },
                include: [
                    {
                        model: sequelize.models.Role,
                        attributes: ['id', 'name',]
                    }
                ],
            });
            if (!user) {
                throw new Error('Invalid email or password');
            }

            const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
            if (!isPasswordValid) {
                throw new Error('Invalid email or password');
            }

            return user;
        }

        getFullName() {
            return `${this.firstName} ${this.lastName}`;
        }

        generateAuthToken() {
            return jwt.sign({ id: this.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        }

        static async getAdmins() {
            const adminRole = await sequelize.models.Role.findOne({ where: { name: 'admin' } });
            if (!adminRole) return [];

            return this.findAll({
                include: [{
                    model: sequelize.models.Role,
                    where: { id: adminRole.id }
                }]
            });
        }

        static async getUsers(search) {
            return this.findAll({
                where: sequelize.or(
                    { name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), 'LIKE', '%' + search + '%') },
                    { firstName: sequelize.where(sequelize.fn('LOWER', sequelize.col('firstName')), 'LIKE', '%' + search + '%') },
                    { lastName: sequelize.where(sequelize.fn('LOWER', sequelize.col('lastName')), 'LIKE', '%' + search + '%') }
                ),
                include: [sequelize.models.Role],
                attributes: { exclude: ['passwordHash'] }
            });
        }

        static async addRoleToUser(userId, roleId, currentUserId) {
            const user = await this.findByPk(userId, { include: [sequelize.models.Role] });
            if (!user) throw new Error('User not found');

            const role = await sequelize.models.Role.findByPk(roleId);
            if (!role) throw new Error('Role not found');

            // Проверяем права текущего пользователя
            const currentUser = await this.findByPk(currentUserId, { include: [sequelize.models.Role] });
            if (!currentUser) throw new Error('Current user not found');

            const isSuperAdmin = currentUser.Roles.some(r => r.name === 'super_admin');
            const isAdmin = currentUser.Roles.some(r => r.name === 'admin');

            // Супер-админ может назначать любые роли
            // Админ может назначать только модераторов
            if (!isSuperAdmin && (isAdmin && role.name !== 'moderator')) {
                throw new Error('Недостаточно прав для назначения этой роли');
            }

            await sequelize.models.UserRole.assignToUser(userId, roleId);

            // Логируем действие
            await sequelize.models.ActionHistory.logAction(
                currentUserId,
                'AddRoleToUser',
                `Пользователю ${user.email} назначена роль ${role.name}`,
                userId
            );

            return user;
        }

        static async removeRoleFromUser(userId, roleId, currentUserId) {
            const user = await this.findByPk(userId, { include: [sequelize.models.Role] });
            if (!user) throw new Error('User not found');

            const role = await sequelize.models.Role.findByPk(roleId);
            if (!role) throw new Error('Role not found');

            // Проверяем права текущего пользователя
            const currentUser = await this.findByPk(currentUserId, { include: [sequelize.models.Role] });
            if (!currentUser) throw new Error('Current user not found');

            const isSuperAdmin = currentUser.Roles.some(r => r.name === 'super_admin');
            const isAdmin = currentUser.Roles.some(r => r.name === 'admin');

            // Супер-админ может удалять любые роли
            // Админ может удалять только модераторов
            if (!isSuperAdmin && (isAdmin && role.name !== 'moderator')) {
                throw new Error('Недостаточно прав для удаления этой роли');
            }

            await sequelize.models.UserRole.removeFromUser(userId, roleId);

            // Логируем действие
            await sequelize.models.ActionHistory.logAction(
                currentUserId,
                'RemoveRoleFromUser',
                `У пользователя ${user.email} удалена роль ${role.name}`,
                userId
            );

            return user;
        }

        static async getUserRoles(userId) {
            const user = await this.findByPk(userId, {
                include: [sequelize.models.Role]
            });

            if (!user) throw new Error('User not found');

            return user.Roles;
        }
    }

    User.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        passwordHash: {
            type: DataTypes.STRING,
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
        }
    }, {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        timestamps: true
    });

    return User;
};