const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../../middleware/auth.middleware');

// Страница добавления администраторов
router.get('/', authenticate, requireRole('super_admin', 'admin'), (req, res) => {
    res.render('admin', { title: 'Администрирование' })
});

module.exports = router;