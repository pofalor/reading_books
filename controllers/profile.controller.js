const { User, sequelize, ActionHistory } = require('../models');

// Получить страницу профиля
exports.getProfilePage = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).render('error-401', {
                title: 'Ошибка 401',
                errorTitle: 'Доступ запрещен',
                needLoginButton: true,
                needRegisterButton: true,
                errorMessage: `Для просмотра этой страницы необходимо авторизоваться. 
                            Пожалуйста, войдите в систему или зарегистрируйтесь.`,
                needAdditionalButton: false
            });
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
    let transaction;
    try {
        const { firstName, lastName } = req.body;
        const userId = req.user.id;

        // Валидация
        if (!firstName || !lastName) {
            throw new Error('Пожалуйста, заполните все поля');
        }

        if (firstName.length < 2) {
            throw new Error('Имя должно содержать минимум 2 символа');
        }

        if (lastName.length < 2) {
            throw new Error('Фамилия должна содержать минимум 2 символа');
        }

        if (firstName.length > 50) {
            throw new Error('Максимальная длина имени 50 символов');
        }

        if (lastName.length > 50) {
            throw new Error('Максимальная длина фамилии 50 символов');
        }

        // Обновление пользователя
        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error('Не найден пользователь. Пожалуйста, попробуйте ещё раз. Если ошибка повторится, обратитесь в поддержку.');
        }

        const oldFirstName = user.firstName;
        const oldLastName = user.lastName;

        transaction = await sequelize.transaction();

        await user.update({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
        }, {transaction});

        // Логирование действия
        await ActionHistory.logAction(
            req.user.id,
            'UpdateProfile',
            `Пользователь "${user.email}" сменил имя и фамилию. 
            Старое имя: "${oldFirstName}". Старая фамилия: "${oldLastName}". 
            Новое имя: "${firstName}". Новая фамилия: "${user.lastName}".`,
            null,
            null,
            null,
            null,
            transaction
        );

        // Фиксируем транзакцию
        await transaction.commit();

        // Обновляем данные в сессии/локальных переменных
        //Необязательно, просто на всякий случай обновляем
        // res.locals.user.firstName = user.firstName;
        // res.locals.user.lastName = user.lastName;
        res.status(200).json(user);
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Ошибка при обновлении профиля: ', error);
        res.status(500).json({ message: error.message });
    }
};