const express = require('express');
const router = express.Router();
const readingController = require('../../controllers/reading.controller');
const { attachBookToRequest } = require('../../middleware/book.middleware');

router.get('/', attachBookToRequest, readingController.getReaderPage);

module.exports = router;