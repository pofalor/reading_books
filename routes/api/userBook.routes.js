const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../../middleware/auth.middleware');
const userBookController = require('../../controllers/userBook.controller');

router.get('/', authenticate, userBookController.addToShelf);
router.delete('/', authenticate, userBookController.removeFromShelf);

module.exports = router;