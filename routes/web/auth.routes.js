const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client', 'public', 'auth', 'register.html'));
});
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client', 'public', 'auth', 'login.html'));
});

module.exports = router;