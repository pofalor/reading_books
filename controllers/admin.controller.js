const path = require('path');
const fs = require('fs');
const { User, Role, Transaction, Book, sequelize, Op } = require('../models');

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