const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../../middleware/auth.middleware');
const adminController = require('../../controllers/admin.controller');

router.post('/getUsers', authenticate, requireRole('super_admin', 'admin'), adminController.getUsers);

module.exports = router;