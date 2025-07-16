const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../../middleware/auth.middleware');
const genreController = require('../../controllers/genre.controller');

router.get('/', genreController.getAllGenres);
router.post('/', authenticate, requireRole('moderator'), genreController.createGenre);
router.delete('/', authenticate, requireRole('moderator'), genreController.deleteGenre);

module.exports = router;