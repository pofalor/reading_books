const { Genre, ActionHistory, BookGenre, sequelize } = require('../models');

exports.getAllGenres = async (req, res) => {
    try {
        const { body } = req.body;
        const limit = parseInt(body?.limit ?? "100");
        const search = body?.search.toString().toLowerCase();

        const genres = await Genre.getAll(search, limit);

        res.json(genres);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getGenresForUsers = async (req, res) => {
    try {
        const { body } = req.body;
        const limit = parseInt(body?.limit ?? "100");
        const search = body?.search.toString().toLowerCase();

        const genres = await Genre.getGenresWithBookCount(search, limit);

        res.json(genres);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

exports.createGenre = async (req, res) => {
    try {
        const { name, description } = req.body;

        const existGenre = await Genre.findOne({ where: { name } });
        if (existGenre) throw new Error('Жанр с таким названием уже существует');

        const genre = await Genre.create({ name, description });

        await ActionHistory.logAction(
            req.user.id,
            'AddGenre',
            `Жанр "${name}" создан`,
            null,
            null,
            null,
            genre.id
        );

        res.json(genre);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteGenre = async (req, res) => {
    try {
        const { genreId } = req.query;
        const genre = await Genre.findByPk(genreId);

        if (!genre) throw new Error('Жанр не найден');
        // Проверяем, что автор не используется
        const count = await BookGenre.count({ where: { genreId: genreId } });
        if (count > 0) {
            throw new Error('Жанр используется и не может быть удалён');
        }

        await ActionHistory.logAction(
            req.user.id,
            'DeleteGenre',
            `Жанр "${genre.name}" удален`
        );

        await genre.destroy();

        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};