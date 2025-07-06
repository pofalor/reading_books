require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { sequelize } = require('./models');
const { attachUserToRequest } = require('./middleware/auth.middleware');

// Настройка Express
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(attachUserToRequest);

// Путь к статическим файлам (CSS, JS, изображения)
app.use(express.static(path.join(__dirname, 'client', 'public')));

// Путь к EJS шаблонам (рендерятся сервером)
app.set('views', path.join(__dirname, 'client', 'views'));
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