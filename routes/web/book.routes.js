const express = require('express');
const router = express.Router();
const { Book } = require('../../models');

// Страница информации о книге
router.get('/', async (req, res) => {
    const { bookId } = req.query;
    const book = await Book.getBookByIdForUsers(bookId, req.user?.id);

    if (!book) {
        return res.status(404).render('error', {
            title: 'Книга не найдена',
            message: 'Страница не найдена'
        });
    }

    res.render('book', { book })
});

module.exports = router;