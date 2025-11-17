const express = require('express');
const router = express.Router();
const profileController = require('../../controllers/profile.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// Обновление профиля
router.post('/update', authenticate, profileController.updateProfile);

module.exports = router;