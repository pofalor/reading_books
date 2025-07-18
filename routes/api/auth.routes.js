const express = require('express');
const router = express.Router();
const { User } = require('../../models');
const { authenticate, attachUserToRequest } = require('../../middleware/auth.middleware');
const authController = require('../../controllers/auth.controller');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/profile', authenticate, authController.getProfile);
router.get('/isAuthorized', attachUserToRequest, (req, res) => {
    res.send(!!res.locals.user);
});

module.exports = router;