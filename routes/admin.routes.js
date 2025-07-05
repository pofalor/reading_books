const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

// Страница добавления администраторов
router.get('/', authenticate, requireRole, adminController.getAdminPage);

module.exports = router;