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
router.get('/:id', bookController.getBookById);

// Защищенные маршруты
router.post(
  '/',
  authenticate,
  requireRole('moderator'),
  bookController.createBook
);

router.post(
  '/upload',
  authenticate,
  requireRole('moderator'),
  bookUpload.single('bookFile'),
  bookController.uploadBookFile
);

router.put(
  '/:id',
  authenticate,
  requireRole('moderator'),
  bookController.updateBook
);

router.delete(
  '/:id',
  authenticate,
  requireRole('moderator'),
  bookController.deleteBook
);

module.exports = router;