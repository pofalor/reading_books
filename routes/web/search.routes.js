const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { genreId, genreName } = req.query;
        
        res.render('book-search', {
            title: 'Поиск книг',
            user: res.locals?.user,
            initialGenre: genreId && genreName ? JSON.stringify([{display: genreName, value: genreId}]) : []
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;