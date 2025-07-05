const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Конфигурация для загрузки книг
const bookStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/books');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// Конфигурация для загрузки обложек
const coverStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/covers');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// Фильтры файлов
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/epub+zip'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'), false);
    }
};

// Экспорт настроек
module.exports = {
    bookUpload: multer({
        storage: bookStorage,
        fileFilter,
        limits: {
            fileSize: 50 * 1024 * 1024 // 50MB
        }
    }),

    coverUpload: multer({
        storage: coverStorage,
        fileFilter: (req, file, cb) => {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only images are allowed'), false);
            }
        },
        limits: {
            fileSize: 5 * 1024 * 1024 // 5MB
        }
    }),

    // Утилита для очистки загруженных файлов при ошибке
    cleanUpFiles: (files) => {
        if (!files) return;

        Object.values(files).forEach(fileArray => {
            fileArray.forEach(file => {
                try {
                    fs.unlinkSync(file.path);
                } catch (err) {
                    console.error('Error deleting file:', err);
                }
            });
        });
    }
};