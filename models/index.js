const { Sequelize, DataTypes, Op } = require('sequelize');
const { requireEnv } = require('../config/env');

// Без значений по умолчанию: иначе при незаданном окружении приложение
// молча подключалось бы под учётными данными из исходников.
requireEnv('DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false
    }
);

// Импорт моделей
const User = require('./user.model')(sequelize, DataTypes, Sequelize);
const Role = require('./role.model')(sequelize, DataTypes);
const UserRole = require('./userRole.model')(sequelize, DataTypes);
const Author = require('./author.model')(sequelize, DataTypes);
const Book = require('./book.model')(sequelize, DataTypes);
const Genre = require('./genre.model')(sequelize, DataTypes);
const BookGenre = require('./bookGenre.model')(sequelize, DataTypes);
const UserBook = require('./userBook.model')(sequelize, DataTypes);
const Transaction = require('./transaction.model')(sequelize, DataTypes);
const ActionHistory = require('./actionHistory.model')(sequelize, DataTypes);

// Установка связей
require('./associations')(sequelize.models);

module.exports = {
  sequelize,
  ...sequelize.models,
  Op
};