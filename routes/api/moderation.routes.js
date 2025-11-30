const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../../middleware/auth.middleware');
const moderationController = require('../../controllers/moderation.controller');
const { bookUpload } = require('../../config/multer.config');

router.put('/books/update', authenticate, requireRole('moderator'), bookUpload.single('file'), moderationController.updateBook);
router.put('/authors/update', authenticate, requireRole('moderator'), moderationController.updateAuthor);
router.put('/genres/update', authenticate, requireRole('moderator'), moderationController.updateGenre);

module.exports = router;