require('dotenv').config();
const express = require('express');
const { Sequelize, DataTypes, Model, Op } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const cookieParser = require('cookie-parser')

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'books');
        require('fs').mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

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
        const user = await this.findOne({
            where: { email },
            include: [
                {
                    model: Role,
                    attributes: ['id', 'name',]
                }
            ],
        });
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

    static async createAdmin(adminData, currentUserId) {
        // Проверяем права текущего пользователя
        const currentUser = await this.findByPk(currentUserId, {
            include: [Role]
        });

        if (!currentUser || !currentUser.Roles.some(r => r.name === 'super_admin')) {
            throw new Error('Только супер-администратор может создавать администраторов');
        }

        // Создаем пользователя
        const admin = await this.create({
            ...adminData,
            isActive: true
        });

        // Назначаем роль администратора
        const adminRole = await Role.findOne({ where: { name: 'admin' } });
        if (!adminRole) {
            throw new Error('Роль администратора не найдена в системе');
        }

        await admin.addRole(adminRole.id);

        return admin;
    }

    static async getAdmins() {
        const adminRole = await Role.findOne({ where: { name: 'admin' } });
        if (!adminRole) return [];

        return this.findAll({
            include: [{
                model: Role,
                where: { id: adminRole.id }
            }]
        });
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

    static async getFeatured(limit = 10) {
        return this.findAll({
            order: [['createdAt', 'DESC']], // Сортировка по убыванию даты
            limit: parseInt(limit),
            include: [
                {
                    model: Author,
                    attributes: ['id', 'firstName', 'secondName', 'surname', 'nickName']
                },
                {
                    model: Genre,
                    through: { attributes: [] }, // Исключаем промежуточную таблицу
                    attributes: ['id', 'name']
                }
            ],
            attributes: {
                exclude: ['updatedAt'] // Исключаем ненужные поля
            }
        });
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

    static async getAll() {
        return await this.findAll();
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
app.use(attachUserToRequest);

//Middleware для проверки авторизации
async function attachUserToRequest(req, res, next) {
    try {
        const token = req?.cookies?.token || req?.headers?.authorization?.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = await User.findByPk(
                decoded.id, {
                include: [Role],
                attributes: { exclude: ['passwordHash'] }
            });
            if (user) {
                res.locals.user = {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    roles: user.Roles.map(role => role.name)
                };
            }
        }
    }
    catch (error) {
        console.error('Error in auth middleware: ', error);
    }
    next();
}

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
            genres: [],
        });
    }
});

// Логин
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.login(email, password);
        const token = user.generateAuthToken();

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000 //1 час
        });

        res.json({ token });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
// Регистрация
app.post('/api/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        const user = await User.register(email, password, firstName, lastName);
        const token = user.generateAuthToken();

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000 //1 час
        });

        res.json({ token });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Получить профиль
app.get('/profile', authenticate, async (req, res) => {
    res.send(req.user);
});

app.get('/auth/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'public', 'auth', 'register.html'));
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

app.get('/auth/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'public', 'auth', 'login.html'));
});

// Маршруты для книг
const bookRouter = express.Router();

// Страница добавления книги
bookRouter.get('/add', requireAuth, requireRole('moderator'), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'books', 'add-book.html'));
});

// Загрузка файла книги
bookRouter.post('/upload',
    requireAuth,
    requireRole('moderator'),
    upload.single('bookFile'),
    (req, res) => {
        // Здесь будет конвертация файла в страницы
        res.json({
            fileId: req.file.filename,
            originalName: req.file.originalname
        });
    }
);

// Добавление новой книги
bookRouter.post('/',
    requireAuth,
    requireRole('moderator'),
    upload.fields([
        { name: 'bookFile', maxCount: 1 },
        { name: 'coverFile', maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            const { title, description, pagesCount, authorId, genres } = req.body;

            // Обработка нового автора
            let author;
            if (authorId) {
                author = await Author.findByPk(authorId);
            } else if (req.body.newAuthor) {
                author = await Author.create(req.body.newAuthor);
            } else {
                throw new Error('Author not specified');
            }

            // Обработка нового жанра
            let genreIds = [];
            if (genres) {
                genreIds = genres.split(',');
            }

            if (req.body.newGenre) {
                const newGenre = await Genre.create(req.body.newGenre);
                genreIds.push(newGenre.id);
            }

            // Конвертация файла книги в страницы
            const bookFile = req.files['bookFile'][0];
            const pages = await convertBookToPages(bookFile, pagesCount);

            // Создание книги
            const book = await Book.create({
                title,
                description,
                pagesCount,
                authorId: author.id,
                coverUrl: req.files['coverFile'] ? '/uploads/' + req.files['coverFile'][0].filename : null,
                pagesDirectory: pages.directory
            });

            // Добавление жанров
            await book.addGenres(genreIds);

            res.json({
                success: true,
                bookId: book.id
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

app.use('/api/books', bookRouter);

// Страница добавления администраторов
app.get('/admin', (req, res) => {
    res.render('admin', { title: 'Администрирование' });
});

// Вспомогательная функция для конвертации
async function convertBookToPages(file, pagesCount) {
    const outputDir = path.join(__dirname, 'uploads', 'pages', Date.now().toString());
    require('fs').mkdirSync(outputDir, { recursive: true });

    // Здесь будет логика конвертации файла в страницы
    // Это пример - реализация зависит от используемых библиотек

    return {
        directory: outputDir,
        pages: pagesCount
    };
}

// Проверка аутентификации
function requireAuth(req, res, next) {
    const token = req.cookies.token || req.headers['authorization'];

    if (!token) {
        return res.redirect('/auth');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.redirect('/auth');
    }
}


function requireRole(role) {
    return async (req, res, next) => {
        const token = req.cookies.token || req.headers['authorization'];

        if (!token) {
            return res.status(401).send('Unauthorized');
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findByPk(decoded.id, {
                include: [Role]
            });

            if (!user || !user.Roles.some(r => r.name === role)) {
                return res.status(403).send('Forbidden');
            }

            req.user = user;
            next();
        } catch (error) {
            res.status(401).send('Unauthorized');
        }
    };
}

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