const { Genre, ActionHistory } = require('../models');

exports.getAllGenres = async (req, res) => {
    try {
        const { body } = req.body;
        const limit = parseInt(body.limit) || 100;
        const search = body.search.toString().toLowerCase();

        const genres = await Genre.findAll({
            where: sequelize.or(
                { name: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), 'LIKE', '%' + search + '%') },
                { description: sequelize.where(sequelize.fn('LOWER', sequelize.col('description')), 'LIKE', '%' + search + '%') }
            ), 
            limit: limit
        });

        if (genres.length === 0) {
            return res.json({ hidden: true });
        }

        res.json(genres);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createGenre = async (req, res) => {
    try {
        const { name, description } = req.body;
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
        const { genreId } = req.body;
        const genre = await Genre.findByPk(genreId);

        if (!genre) throw new Error('Жанр не найден');

        await genre.destroy();

        await ActionHistory.logAction(
            req.user.id,
            'DeleteGenre',
            `Жанр "${genre.name}" удален`,
            null,
            null,
            null,
            genreId
        );

        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};