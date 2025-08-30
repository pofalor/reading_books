const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../../middleware/auth.middleware');

router.get('/', authenticate, requireRole('super_admin', 'admin', 'moderator'), (req, res) => {
    res.render('action-history', { title: 'История действий' })
});

module.exports = router;