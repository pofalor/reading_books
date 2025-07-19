const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../../middleware/auth.middleware');
const authorController = require('../../controllers/author.controller');

// Добавим маршруты для модерации
router.post('/approve', authenticate, requireRole('moderator'), authorController.approveAuthor);
router.post('/getAll', authenticate, requireRole('moderator'), authorController.getAllAuthors);
router.post('/', authenticate, requireRole('moderator'), authorController.createNew);

module.exports = router;