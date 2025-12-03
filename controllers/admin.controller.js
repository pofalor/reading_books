const path = require('path');
const fs = require('fs');
const { User, Role, Transaction, Book,  Author, sequelize, Op } = require('../models');

exports.getAdmins = async (req, res) => {
    try {
        const admins = await User.getAdmins();
        res.json(admins);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const { search } = req.body;
        const searchStr = search.toString().toLowerCase();
        const users = await User.getUsers(searchStr);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getRoles = async (req, res) => {
    try {
        const roles = await Role.getAllRoles();
        res.json(roles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUserRoles = async (req, res) => {
    try {
        const { userId } = req.query;
        const roles = await User.getUserRoles(userId);
        res.json(roles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addRole = async (req, res) => {
    try {
        const { name, description } = req.body;
        const currentUserId = req.user.id;
        const role = await Role.addRole(name, description, currentUserId);
        res.json(role);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteRole = async (req, res) => {
    try {
        const { name } = req.body;
        const currentUserId = req.user.id;
        await Role.deleteRole(name, currentUserId);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.addUserRole = async (req, res) => {
    try {
        const { userId, roleId } = req.body;
        const currentUserId = req.user.id;
        const user = await User.addRoleToUser(userId, roleId, currentUserId);
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.removeUserRole = async (req, res) => {
    try {
        const { userId, roleId } = req.body;
        const currentUserId = req.user.id;
        const user = await User.removeRoleFromUser(userId, roleId, currentUserId);
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getRoleById = async (req, res) => {
    try {
        const { roleId } = req.query;
        const role = await Role.getRoleById(roleId);
        if (!role) throw new Error('Role not found');
        res.json(role);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

exports.updateRole = async (req, res) => {
    let transaction;
    try {
        const { id, name, description } = req.body;
        const currentUserId = req.user.id;
        
        transaction = await sequelize.transaction();

        // Проверяем существование роли
        const role = await Role.findByPk(id, { transaction });
        if (!role) {
            return res.status(404).json({ message: 'Системная ошибка: роль не найдена. Пожалуйста, обратитесь в поддержку' });
        }
        
        // Проверяем, не существует ли уже роли с таким именем (кроме текущей)
        const existingRole = await Role.findOne({ where: { name }, transaction });
        if (existingRole && existingRole.id !== parseInt(id)) {
            return res.status(400).json({ message: 'Роль с таким именем уже существует' });
        }
        
        // Обновляем роль
        const oldName = role.name;
        const oldDescr = role.description;
        role.name = name;
        role.description = description;
        await role.save({transaction});
        
        // Логируем действие
        await sequelize.models.ActionHistory.logAction(
            currentUserId,
            'UpdateRole',
            `Обновлена роль: ${oldName} → ${name}, ${oldDescr} → ${description}`,
            null, 
            null,
            null, 
            null,
            transaction
        );
        
        await transaction.commit();

        res.json({ success: true, role });
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Error updating role: ', error);
        res.status(400).json({ message: error.message || 'Ошибка обновления роли' });
    }
};

exports.getStats = async (req, res) => {
    try {
        const { limit, beginDate, endDate } = req.body;

        const baseWhere = {
            type: 'PURCHASE',
            status: 'COMPLETED'
        };

        // Добавляем фильтрацию по датам, если они переданы
        if (beginDate || endDate) {
            baseWhere.date = {};
            if (beginDate) baseWhere.date[Op.gte] = new Date(beginDate);
            if (endDate) baseWhere.date[Op.lte] = new Date(endDate);
        }

        const totalPurchases = await Transaction.count({ where: baseWhere });
        const totalRevenue = await Transaction.sum('amount', { where: baseWhere });
        const avgPurchase = totalPurchases > 0 ? (totalRevenue / totalPurchases).toFixed(2) : 0;

        // Находим самую популярную книгу
        const topBook = await Transaction.findOne({
            attributes: [
                'bookId',
                [sequelize.fn('COUNT', sequelize.col('bookId')), 'purchaseCount']
            ],
            where: baseWhere,
            group: ['bookId'],
            order: [[sequelize.literal('purchaseCount'), 'DESC']],
            include: [{
                model: Book,
                attributes: ['title', 'id']
            }],
            raw: true,
            nest: true
        });

        const stats = {
            totalPurchases,
            totalRevenue,
            avgPurchase,
            topBook: topBook?.Book
        };

        const purchasesWhere = { type: 'PURCHASE' };
        if (beginDate || endDate) {
            purchasesWhere.date = {};
            if (beginDate) purchasesWhere.date[Op.gte] = new Date(beginDate);
            if (endDate) purchasesWhere.date[Op.lte] = new Date(endDate);
        }

        // Получаем последние покупки
        const purchases = await Transaction.findAll({
            where: purchasesWhere,
            limit: limit || undefined,
            order: [['date', 'DESC']],
            include: [
                {
                    model: Book,
                    attributes: ['title']
                },
                {
                    model: User,
                    attributes: ['email']
                }
            ]
        });

        res.json({
            stats,
            purchases
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

exports.updatePurchaseStatus = async (req, res) => {
    let transaction;
    try {
        const { purchaseId, status } = req.body;
        const currentUserId = req.user.id;
        
        // Проверяем валидность статуса
        const validStatuses = ['PENDING', 'COMPLETED', 'FAILED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Системная ошибка: неверный статус. Пожалуйста обратитесь в поддержку' });
        }

        transaction = await sequelize.transaction();
        
        // Находим покупку
        const purchase = await Transaction.findByPk(purchaseId, {
            include: [
                { model: User, attributes: ['id', 'email'] },
                { model: Book, attributes: ['id', 'title'], 
                    include: [  // Вложенное включение для получения автора книги
                        { model: Author, attributes: ['id'] }
                    ] 
                }
            ], 
            transaction
        });
        
        if (!purchase) {
            return res.status(404).json({ message: 'Системная ошибка: транзакция не найдена. Пожалуйста обратитесь в поддержку' });
        }
        
        const oldStatus = purchase.status;
        
        // Обновляем статус
        purchase.status = status;
        await purchase.save();
        
        // Логируем действие
        await sequelize.models.ActionHistory.logAction(
            currentUserId,
            'UpdatePurchaseStatus',
            `Изменен статус покупки #${purchaseId}: ${oldStatus} → ${status}. ` +
            `Пользователь: ${purchase.User.email}, Книга: ${purchase.Book.title}`,
            purchase.User.id, 
            purchase.Book.Author.id, 
            purchase.Book.id,
            null, 
            transaction
        );

        await transaction.commit();
        
        res.json({ success: true, purchase });
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Error updating purchase status: ', error);
        res.status(400).json({ message: error.message || 'Ошибка обновления статуса' });
    }
};