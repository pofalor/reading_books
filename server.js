const { requireEnv } = require('./config/env');

// Проверяем окружение до подключения остальных модулей: models/index.js
// создаёт подключение к БД уже на этапе require, а JWT_SECRET без этой
// проверки выстрелил бы только на первом логине.
try {
    requireEnv(
        'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST',
        'JWT_SECRET', 'BOOK_UPLOAD_PATH'
    );
} catch (err) {
    console.error(err.message);
    process.exit(1);
}

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { sequelize } = require('./models');
const { attachUserToRequest } = require('./middleware/auth.middleware');
const { COVER_UPLOAD_DIR } = require('./config/multer.config');

// Настройка Express
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(attachUserToRequest);

// Путь к статическим файлам (CSS, JS, изображения)
app.use(express.static(path.join(__dirname, 'client', 'public')));

// Обложки книг. Наружу раздаётся только uploads/covers: файлы самих книг
// лежат в uploads/books и отдаются через /api/books/download с проверкой прав.
// Имена файлов — uuid и при замене обложки меняются, поэтому кэш можно держать долго.
app.use('/uploads/covers', express.static(COVER_UPLOAD_DIR, {
    index: false,
    maxAge: '30d',
    immutable: true
}));

// Путь к EJS шаблонам (рендерятся сервером)
app.set('views', [path.join(__dirname, 'client', 'views'), path.join(__dirname, 'client', 'views', 'errors')]);
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));

// Routes
app.use(require('./routes'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal server error.');
});

// Запуск сервера
async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Connection to DB has been established successfully.');

        await sequelize.sync({ force: false });
        console.log('Database synchronized');

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Unable to connect to the database:', err);
        process.exit(1);
    }
}

startServer();