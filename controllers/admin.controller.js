const path = require('path');
const fs = require('fs');
const { User, Role } = require('../models');

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