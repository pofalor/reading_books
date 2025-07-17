const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../../middleware/auth.middleware');
const authorController = require('../../controllers/author.controller');

// Добавим маршруты для модерации
router.get('/pending', authenticate, requireRole('moderator'), authorController.getPendingAuthors);
router.post('/approve', authenticate, requireRole('moderator'), authorController.approveAuthor);
router.get('/getAll', authenticate, requireRole('moderator'), authorController.getAllAuthors);

module.exports = router;