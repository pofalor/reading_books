// Конфигурация подключения к БД для sequelize-cli и sequelize-mig.
// Само приложение поднимает Sequelize в models/index.js.
const { requireEnv } = require('./env');

requireEnv('DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST');

const connection = {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'mysql'
};

// Окружения различаются содержимым .env, а не захардкоженными значениями.
module.exports = {
    development: { ...connection },
    test: { ...connection },
    production: { ...connection }
};
