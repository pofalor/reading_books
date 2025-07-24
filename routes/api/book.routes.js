const express = require('express');
const router = express.Router();
const bookController = require('../../controllers/book.controller');
const { authenticate, requireRole } = require('../../middleware/auth.middleware');
const { bookUpload } = require('../../config/multer.config');

// Публичные маршруты
router.get('/featured', bookController.getFeaturedBooks);

//Модераторские маршруты
router.post('/approve', authenticate, requireRole('moderator'), bookController.approveBook);
router.post('/getAll', authenticate, requireRole('moderator'), bookController.getAllBooks);
router.post('/', authenticate, requireRole('moderator'), bookUpload.single('file'), bookController.createBook);

module.exports = router;