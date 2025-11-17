const express = require('express');
const router = express.Router();
const profileController = require('../../controllers/profile.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// Страница профиля
router.get('/', authenticate, profileController.getProfilePage);

module.exports = router;