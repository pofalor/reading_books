const { User } = require('../models');

// Получить страницу профиля
exports.getProfilePage = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.redirect('/auth/login');
        }

        res.render('profile', {
            title: 'Профиль',
            user: user
        });
    } catch (error) {
        console.error('Ошибка при загрузке профиля: ', error);
        res.status(500).json({ message: error.message });
    }
};

// Обновить данные профиля
exports.updateProfile = async (req, res) => {
    try {
        const { firstName, lastName } = req.body;
        const userId = res.locals.user.id;

        // Валидация
        if (!firstName || !lastName) {
            return res.redirect('/profile?error=Имя и фамилия обязательны');
        }

        if (firstName.length < 2 || lastName.length < 2) {
            return res.redirect('/profile?error=Имя и фамилия должны содержать минимум 2 символа');
        }

        // Обновление пользователя
        const user = await User.findByPk(userId);
        if (!user) {
            return res.redirect('/profile?error=Пользователь не найден');
        }

        await user.update({
            firstName: firstName.trim(),
            lastName: lastName.trim()
        });

        // Обновляем данные в сессии/локальных переменных
        res.locals.user.firstName = user.firstName;
        res.locals.user.lastName = user.lastName;

        res.redirect('/profile?success=Профиль успешно обновлен');
    } catch (error) {
        console.error('Ошибка при обновлении профиля:', error);
        res.redirect('/profile?error=Произошла ошибка при обновлении профиля');
    }
};