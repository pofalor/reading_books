const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../../middleware/auth.middleware');
const authorController = require('../../controllers/author.controller');

// Маршруты для модерации
router.post('/approve', authenticate, requireRole('moderator'), authorController.approveAuthor);
router.post('/getAll', authenticate, requireRole('moderator'), authorController.getAllAuthors);
router.post('/', authenticate, requireRole('moderator'), authorController.createNew);
router.get('/delete', authenticate, requireRole('moderator'), authorController.delete);

//Маршруты для всех
router.post('/search', authorController.searchApproved);

module.exports = router;