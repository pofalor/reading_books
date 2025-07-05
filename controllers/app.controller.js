const { User, Book, Genre } = require('../models');

exports.getMainPage = async (req, res) => {
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
};