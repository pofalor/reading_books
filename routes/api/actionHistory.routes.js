const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../../middleware/auth.middleware');
const actionHistoryController = require('../../controllers/actionHistory.controller');

router.post('/getAll', authenticate, requireRole('super_admin', 'admin', 'moderator'), actionHistoryController.getActionHistory);

module.exports = router;