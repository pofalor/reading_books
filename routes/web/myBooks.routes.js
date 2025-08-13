const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const getMyBooksController = require('../../controllers/mybooks.controller');

router.get('/', authenticate, getMyBooksController.getMyBooksPage);

module.exports = router;