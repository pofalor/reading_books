const path = require('path');
const fs = require('fs');
const { User } = require('../models');

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