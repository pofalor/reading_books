const express = require('express');
const router = express.Router();
const bookController = require('../../controllers/book.controller');
const { authenticate, requireRole } = require('../../middleware/auth.middleware');
const { bookUpload, coverUpload } = require('../../config/multer.config');

// Публичные маршруты
router.get('/featured', bookController.getFeaturedBooks);
router.get('/pending', authenticate, requireRole('moderator'), bookController.getPendingBooks);
router.post('/approve', authenticate, requireRole('moderator'), bookController.approveBook);
router.get('/', bookController.getAllBooks);

module.exports = router;