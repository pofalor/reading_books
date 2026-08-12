require('dotenv').config();

// Проверка обязательных переменных окружения.
// Приложение должно падать сразу при старте с понятным сообщением,
// а не спустя время — на первом логине или первой загрузке файла.
function requireEnv(...names) {
    const missing = names.filter(name => !process.env[name]);

    if (missing.length) {
        throw new Error(
            `Не заданы обязательные переменные окружения: ${missing.join(', ')}. ` +
            'Скопируйте .env.example в .env и заполните значения.'
        );
    }
}

module.exports = { requireEnv };
