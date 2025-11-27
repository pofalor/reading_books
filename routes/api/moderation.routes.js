const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const moderationController = require('../../controllers/moderation.controller');

router.put('/books/update', authenticate, moderationController.updateBook);
router.put('/authors/update', authenticate, moderationController.updateAuthor);
router.put('/genres/update', authenticate, moderationController.updateGenre);

module.exports = router;