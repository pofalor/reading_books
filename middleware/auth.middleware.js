const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

// Аутентификация
const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.token;
        if (!token) {
            return res.status(401).render('error-401', {
                title: 'Ошибка 401',
                message: 'Доступ запрещен'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id, {
            include: [Role],
            attributes: { exclude: ['passwordHash'] }
        });

        if (!user) {
            throw new Error();
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).render('error-401', {
            title: 'Ошибка 401',
            message: 'Доступ запрещен'
        });
    }
};

//Middleware для проверки авторизации
const attachUserToRequest = async (req, res, next) => {
    try {
        const token = req?.cookies?.token || req?.headers?.authorization?.split(' ')[1];
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findByPk(decoded.id, {
                include: [Role],
                attributes: { exclude: ['passwordHash'] }
            });

            if (user) {
                res.locals.user = {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    roles: user.Roles.map(role => role.name)
                };
            }
        }
    } catch (error) {
        console.error('Error in auth middleware:', error);
    }
    next();
};

const requireRole = function (...role) {
    return async (req, res, next) => {
        const token = req.cookies.token || req.headers['authorization'];
        if (!token) {
            return res.status(401).send('Unauthorized');
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findByPk(decoded.id, {
                include: [Role]
            });

            if (!user || !user.Roles.some(r => role.includes(r.name))) {
                return res.status(403).render('error-403', {
                    user: req.user,
                    requiredRole: role.toString()
                });
            }

            req.user = user;
            next();
        } catch (error) {
            res.status(401).render('error-401', {
                title: 'Ошибка 401',
                message: 'Доступ запрещен'
            });
        }
    }
};

module.exports = { authenticate, attachUserToRequest, requireRole };