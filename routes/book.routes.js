const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { bookUpload, coverUpload } = require('../config/multer.config');

// Публичные маршруты
router.get('/featured', bookController.getFeaturedBooks);
router.get('/', bookController.getAllBooks);
router.get('/:id', bookController.getBookById);

// Защищенные маршруты
router.post(
  '/',
  authenticate,
  requireRole,
  bookController.createBook
);

router.post(
  '/upload',
  authenticate,
  requireRole,
  bookUpload.single('bookFile'),
  bookController.uploadBookFile
);

router.put(
  '/:id',
  authenticate,
  requireRole,
  bookController.updateBook
);

router.delete(
  '/:id',
  authenticate,
  requireRole,
  bookController.deleteBook
);

module.exports = router;