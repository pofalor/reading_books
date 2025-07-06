const express = require('express');
const router = express.Router();
const { Book, Genre } = require('../../models');

router.get('/', async (req, res) => {
    try {
        const featuredBooks = await Book.getFeatured(); // Ваш метод получения книг
        res.render('index', {
            title: 'Главная',
            featuredBooks: featuredBooks || [], // Гарантируем что будет массив
            genres: await Genre.getAll() || []
        });
    } catch (error) {
        console.error(error);
        res.render('index', {
            title: 'Главная',
            featuredBooks: [], // Пустой массив если ошибка
            genres: [],
        });
    }
});

module.exports = router;