const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Логин
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.login(email, password);
        const token = user.generateAuthToken();

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000
        });

        res.json({ token });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Регистрация
exports.register = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        const user = await User.register(email, password, firstName, lastName);
        const token = user.generateAuthToken();

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000
        });

        res.json({ token });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Получить профиль
exports.getProfile = async (req, res) => {
    res.send(req.user);
};