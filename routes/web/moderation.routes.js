const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../../middleware/auth.middleware');

// Страница добавления администраторов
router.get('/', authenticate, requireRole('moderator'), (req, res) => {
    res.render('moderation', { title: 'Модерация', activeTab: req.query?.tab || 'books' })
});

module.exports = router;