const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const readingController = require('../../controllers/reading.controller');
const { UserBook } = require('../../models');
const { attachBookToRequest } = require('../../middleware/book.middleware');

router.get('/pages', attachBookToRequest, readingController.getPageContent);
router.post('/progress', authenticate, async (req, res) => {
    try {
        const { bookId, currentPage } = req.body;
        const userBook = await UserBook.updateReadingProgress(
            req.user.id,
            bookId,
            currentPage
        );
        res.json({ success: true, userBook });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;