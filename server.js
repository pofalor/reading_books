require('dotenv').config();
const express = require('express');
const { Sequelize, DataTypes, Model, Op } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());;

// Настройка Sequelize
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

// Модели

// Пользователь
class User extends Model {
    static async register(email, password, firstName, lastName) {
        const passwordHash = await bcrypt.hash(password, 10);
        return this.create({ email, passwordHash, firstName, lastName });
    }

    static async login(email, password) {
        const user = await this.findOne({ where: { email } });
        if (!user) {
            throw new Error('Invalid email or password');
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }
        
        return user;
    }

    getFullName() {
        return `${this.firstName} ${this.lastName}`;
    }

    generateAuthToken() {
        return jwt.sign({ id: this.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    }
}

User.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    passwordHash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    }
}, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true
});

// Роль
class Role extends Model {
    static async createNew(roleName, description) {
        return this.create({ name: roleName, description });
    }
}

Role.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.STRING
    }
}, {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    timestamps: false
});

// Связь пользователя и роли
class UserRole extends Model {
    static async assignToUser(userId, roleId) {
        const exists = await this.hasUserRole(userId, roleId);
        if (exists) {
            throw new Error('Role already assigned to user');
        }
        return this.create({ userId, roleId });
    }

    static async hasUserRole(userId, roleId) {
        const count = await this.count({ where: { userId, roleId } });
        return count > 0;
    }

    static async removeFromUser(userId, roleId) {
        return this.destroy({ where: { userId, roleId } });
    }
}

UserRole.init({
    userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    roleId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: Role,
            key: 'id'
        }
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    }
}, {
    sequelize,
    modelName: 'UserRole',
    tableName: 'user_roles',
    timestamps: false
});

// Автор
class Author extends Model {
    static async createNew(authorData) {
        return this.create(authorData);
    }

    static async deleteAuthor(authorId) {
        const author = await this.findByPk(authorId);
        if (!author) {
            throw new Error('Author not found');
        }
        return author.destroy();
    }

    getFullName() {
        return `${this.firstName} ${this.secondName ? this.secondName + ' ' : ''}${this.surname}`;
    }
}

Author.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    secondName: {
        type: DataTypes.STRING
    },
    surname: {
        type: DataTypes.STRING,
    },
    nickName: {
        type: DataTypes.STRING
    },
    birthDate: {
        type: DataTypes.DATEONLY
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    }
}, {
    sequelize,
    modelName: 'Author',
    tableName: 'authors',
    timestamps: false
});

// Книга
class Book extends Model {
    static async createBook(bookData) {
        return this.create(bookData);
    }

    static async deleteBook(bookId) {
        const book = await this.findByPk(bookId);
        if (!book) {
            throw new Error('Book not found');
        }
        return book.destroy();
    }
}

Book.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isConfirmed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    publicationDate: {
        type: DataTypes.DATEONLY
    },
    description: {
        type: DataTypes.TEXT
    },
    pagesCount: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    authorId: {
        type: DataTypes.INTEGER,
        references: {
            model: Author,
            key: 'id'
        }
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    }
}, {
    sequelize,
    modelName: 'Book',
    tableName: 'books',
    timestamps: false
});

// Жанр
class Genre extends Model {
    static async createGenre(name, description) {
        return this.create({ name, description });
    }

    static async editGenre(genreId, editModel) {
        const genre = await this.findByPk(genreId);
        if (!genre) {
            throw new Error('Genre not found');
        }
        return genre.update(editModel);
    }
}

Genre.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.TEXT
    }
}, {
    sequelize,
    modelName: 'Genre',
    tableName: 'genres',
    timestamps: false
});

// Связь книги и жанра
class BookGenre extends Model {
    static async validateGenreExists(genreId) {
        const genre = await Genre.findByPk(genreId);
        return !!genre;
    }

    static async addGenre(bookId, genreId) {
        const exists = await this.findOne({ where: { bookId, genreId } });
        if (exists) {
            throw new Error('Genre already added to book');
        }
        return this.create({ bookId, genreId });
    }

    static async removeGenre(bookId, genreId) {
        return this.destroy({ where: { bookId, genreId } });
    }

    static async getBookGenres(bookId) {
        return this.findAll({ 
            where: { bookId },
            include: [Genre]
        });
    }
}

BookGenre.init({
    bookId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: Book,
            key: 'id'
        }
    },
    genreId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: Genre,
            key: 'id'
        }
    }
}, {
    sequelize,
    modelName: 'BookGenre',
    tableName: 'book_genres',
    timestamps: false
});

// Связь пользователя и книги
class UserBook extends Model {
    static async changeStatus(userId, bookId, newStatus) {
        const userBook = await this.findOne({ where: { userId, bookId } });
        if (!userBook) {
            throw new Error('Book not found in user collection');
        }
        return userBook.update({ status: newStatus });
    }

    static async markAsRead(userId, bookId) {
        const userBook = await this.findOne({ where: { userId, bookId } });
        if (!userBook) {
            throw new Error('Book not found in user collection');
        }
        return userBook.update({ status: 'OnShelf', lastPage: 0 });
    }

    static async addToFavorites(userId, bookId) {
        const [userBook, created] = await this.findOrCreate({
            where: { userId, bookId },
            defaults: { status: 'OnShelf' }
        });
        return userBook;
    }

    static async getFavoriteBooks(userId) {
        return this.findAll({ 
            where: { userId },
            include: [Book]
        });
    }
}

UserBook.init({
    userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    bookId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: Book,
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('OnShelf', 'InProgress', 'Deleted'),
        defaultValue: 'OnShelf'
    },
    addedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    lastUpdated: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    lastPage: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    sequelize,
    modelName: 'UserBook',
    tableName: 'user_books',
    timestamps: false
});

// Транзакция
class Transaction extends Model {
    static async processPayment(userId, bookId, amount) {
        return this.create({
            userId,
            bookId,
            type: 'PURCHASE',
            amount,
            status: 'COMPLETED'
        });
    }

    static async refund(transactionId) {
        const transaction = await this.findByPk(transactionId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        if (transaction.status !== 'COMPLETED') {
            throw new Error('Only completed transactions can be refunded');
        }
        return transaction.update({ status: 'FAILED' });
    }
}

Transaction.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id'
        }
    },
    bookId: {
        type: DataTypes.INTEGER,
        references: {
            model: Book,
            key: 'id'
        }
    },
    type: {
        type: DataTypes.ENUM('PURCHASE'),
        defaultValue: 'PURCHASE'
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    status: {
        type: DataTypes.ENUM('COMPLETED', 'FAILED', 'PENDING'),
        defaultValue: 'PENDING'
    }
}, {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    timestamps: false
});

// История действий
class ActionHistory extends Model {
    static async logAction(userId, actionType, description, authorId = null, bookId = null) {
        return this.create({
            actionType,
            description,
            userId,
            authorId,
            bookId
        });
    }

    static async getActionsByUser(userId) {
        return this.findAll({ where: { userId } });
    }
}

ActionHistory.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    actionType: {
        type: DataTypes.ENUM('AddAuthor', 'AddBook', 'DeleteAuthor', 'DeleteBook'),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id'
        },
        allowNull: true
    },
    authorId: {
        type: DataTypes.INTEGER,
        references: {
            model: Author,
            key: 'id'
        },
        allowNull: true
    },
    bookId: {
        type: DataTypes.INTEGER,
        references: {
            model: Book,
            key: 'id'
        },
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'ActionHistory',
    tableName: 'action_history',
    timestamps: false
});

// Связи между моделями
User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'roleId' });

Author.hasMany(Book, { foreignKey: 'authorId' });
Book.belongsTo(Author, { foreignKey: 'authorId' });

Book.belongsToMany(Genre, { through: BookGenre, foreignKey: 'bookId' });
Genre.belongsToMany(Book, { through: BookGenre, foreignKey: 'genreId' });

User.belongsToMany(Book, { through: UserBook, foreignKey: 'userId' });
Book.belongsToMany(User, { through: UserBook, foreignKey: 'bookId' });

User.hasMany(Transaction, { foreignKey: 'userId' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

Book.hasMany(Transaction, { foreignKey: 'bookId' });
Transaction.belongsTo(Book, { foreignKey: 'bookId' });

User.hasMany(ActionHistory, { foreignKey: 'userId' });
ActionHistory.belongsTo(User, { foreignKey: 'userId' });

Author.hasMany(ActionHistory, { foreignKey: 'authorId' });
ActionHistory.belongsTo(Author, { foreignKey: 'authorId' });

Book.hasMany(ActionHistory, { foreignKey: 'bookId' });
ActionHistory.belongsTo(Book, { foreignKey: 'bookId' });

// Настройка Express
// Путь к EJS шаблонам (рендерятся сервером)
app.set('views', path.join(__dirname, 'client', 'views'));
app.set('view engine', 'ejs');
// Путь к статическим файлам (CSS, JS, изображения)
app.use(express.static(path.join(__dirname, 'client', 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Аутентификация
const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);
        
        if (!user) {
            throw new Error();
        }
        
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).send({ error: 'Please authenticate.' });
    }
};

// Роуты

// Регистрация
app.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        const user = await User.register(email, password, firstName, lastName);
        const token = user.generateAuthToken();
        
        res.status(201).send({ user, token });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// Логин
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.login(email, password);
        const token = user.generateAuthToken();
        
        res.send({ user, token });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// Получить профиль
app.get('/profile', authenticate, async (req, res) => {
    res.send(req.user);
});

// Книги
app.get('/books', async (req, res) => {
    try {
        const books = await Book.findAll({
            include: [Author, { model: Genre, through: { attributes: [] } }]
        });
        res.send(books);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.post('/books', authenticate, async (req, res) => {
    try {
        const book = await Book.createBook(req.body);
        await ActionHistory.logAction(req.user.id, 'AddBook', `Added book ${book.title}`, null, book.id);
        res.status(201).send(book);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

app.get('/', async (req, res) => {
    try {
        const featuredBooks = await Book.getFeatured(); // Ваш метод получения книг
        
        res.render('index', {
            title: 'Главная',
            featuredBooks: featuredBooks || [], // Гарантируем что будет массив
            genres: await Genre.getAll() || []
        });
    } catch (error) {
        console.error(error);
        res.render('index', {
            title: 'Главная',
            featuredBooks: [], // Пустой массив если ошибка
            genres: []
        });
    }
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