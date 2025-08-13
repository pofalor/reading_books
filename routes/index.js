const express = require('express');
const router = express.Router();

// API routes
router.use('/api/auth', require('./api/auth.routes'));
router.use('/api/books', require('./api/book.routes'));
router.use('/api/admin', require('./api/admin.routes'));
router.use('/api/authors', require('./api/author.routes'));
router.use('/api/genres', require('./api/genre.routes'));
router.use('/api/userBook', require('./api/userBook.routes'));

// Web routes
router.use('/', require('./web/app.routes'));
router.use('/auth', require('./web/auth.routes'));
router.use('/admin', require('./web/admin.routes'));
router.use('/moderation', require('./web/moderation.routes'));
router.use('/book', require('./web/book.routes'));
router.use('/reading', require('./web/reading.routes'));
router.use('/my-books', require('./web/myBooks.routes'));

// 404 для web-страниц
router.use((req, res) => {
    res.status(404).render('error', {
        title: 'Ошибка 404',
        message: 'Страница не найдена'
    });
});

module.exports = router;