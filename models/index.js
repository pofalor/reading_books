const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME || 'book_app_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || 'admin',
    {
        host: process.env.DB_HOST || 'localhost',
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
  ...sequelize.models
};