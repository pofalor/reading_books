const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const BOOK_MAX_SIZE = 1000 * 1024 * 1024; // 1000MB
const COVER_MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Обложки публичные и раздаются статикой по этому префиксу (см. server.js),
// файлы книг — нет: их отдаёт только /api/books/download.
const COVER_UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'covers');
const COVER_URL_PREFIX = '/uploads/covers';

// Расширение обложки берётся из MIME-типа, а не из имени файла: иначе
// "cover.html" с подменённым типом легла бы на диск как .html и
// раздавалась бы статикой как страница.
const COVER_TYPES = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
};

// Сигнатуры форматов: MIME-тип присылает клиент, поэтому после загрузки
// проверяем, что в файле действительно картинка.
const COVER_SIGNATURES = {
    'image/jpeg': (b) => b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF,
    'image/png': (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])),
    'image/webp': (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP'
};

// Ошибка, которую можно показать пользователю как есть (ответ 400).
class UploadError extends Error { }

// Пишет поток файла на диск. maxSize задаёт лимит для конкретного поля:
// у multer лимит размера один на все файлы запроса, а epub и обложке
// нужны разные.
function writeFileStream(file, dir, filename, maxSize, cb) {
    fs.mkdir(dir, { recursive: true }, (mkdirErr) => {
        if (mkdirErr) return cb(mkdirErr);

        const filePath = path.join(dir, filename);
        const out = fs.createWriteStream(filePath);
        let size = 0;
        let finished = false;

        const fail = (err) => {
            if (finished) return;
            finished = true;
            file.stream.unpipe(out);
            file.stream.resume(); // дочитываем остаток, иначе запрос повиснет
            const removeAndReport = () => fs.unlink(filePath, () => cb(err));
            if (out.closed) {
                removeAndReport();
            } else {
                out.once('close', removeAndReport);
                out.destroy();
            }
        };

        file.stream.on('data', (chunk) => {
            size += chunk.length;
            if (maxSize && size > maxSize) {
                fail(new multer.MulterError('LIMIT_FILE_SIZE', file.fieldname));
            }
        });
        file.stream.on('error', fail);
        out.on('error', fail);
        out.on('finish', () => {
            if (finished) return;
            finished = true;
            cb(null, { destination: dir, filename, path: filePath, size });
        });

        file.stream.pipe(out);
    });
}

// Хранилище для формы книги: epub (поле file) и обложка (поле cover)
// приходят одним запросом, но пишутся в разные каталоги.
const bookFilesStorage = {
    _handleFile(req, file, cb) {
        if (file.fieldname === 'cover') {
            const filename = `${uuidv4()}${COVER_TYPES[file.mimetype]}`;
            return writeFileStream(file, COVER_UPLOAD_DIR, filename, COVER_MAX_SIZE, cb);
        }

        const dir = path.join(__dirname, '..', process.env.BOOK_UPLOAD_PATH);
        const filename = `${uuidv4()}${path.extname(file.originalname)}`;
        // Для epub действует общий лимит multer (limits.fileSize).
        writeFileStream(file, dir, filename, null, cb);
    },

    _removeFile(req, file, cb) {
        fs.unlink(file.path, (err) => cb(err && err.code !== 'ENOENT' ? err : null));
    }
};

const bookFilesFilter = (req, file, cb) => {
    if (file.fieldname === 'file') {
        return file.mimetype === 'application/epub+zip'
            ? cb(null, true)
            : cb(new UploadError('Файл книги должен быть в формате EPUB'));
    }

    if (file.fieldname === 'cover') {
        return COVER_TYPES[file.mimetype]
            ? cb(null, true)
            : cb(new UploadError('Обложка должна быть в формате JPEG, PNG или WebP'));
    }

    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
};

const parseBookFiles = multer({
    storage: bookFilesStorage,
    fileFilter: bookFilesFilter,
    limits: {
        fileSize: BOOK_MAX_SIZE,
        files: 2
    }
}).fields([
    { name: 'file', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
]);

function uploadErrorMessage(err) {
    if (err instanceof UploadError) return err.message;

    switch (err.code) {
        case 'LIMIT_FILE_SIZE':
            return err.field === 'cover'
                ? `Обложка должна быть не больше ${COVER_MAX_SIZE / 1024 / 1024} МБ`
                : `Файл книги должен быть не больше ${BOOK_MAX_SIZE / 1024 / 1024} МБ`;
        case 'LIMIT_UNEXPECTED_FILE':
            return `Лишний файл в запросе: ${err.field}`;
        default:
            return 'Не удалось загрузить файл';
    }
}

async function hasImageSignature(file) {
    const handle = await fs.promises.open(file.path, 'r');
    try {
        const header = Buffer.alloc(12);
        const { bytesRead } = await handle.read(header, 0, header.length, 0);
        return bytesRead === header.length && COVER_SIGNATURES[file.mimetype](header);
    } finally {
        await handle.close();
    }
}

// Удаляет файлы, загруженные в рамках запроса (req.files от multer.fields)
function cleanUpFiles(files) {
    if (!files) return;

    Object.values(files).forEach(fileArray => {
        fileArray.forEach(file => {
            try {
                fs.unlinkSync(file.path);
            } catch (err) {
                if (err.code !== 'ENOENT') console.error('Error deleting file:', err);
            }
        });
    });
}

// Middleware для создания и редактирования книги: принимает epub и обложку
// одним запросом. Ошибки загрузки превращаются в 400 с понятным текстом;
// уже записанные файлы multer при ошибке удаляет сам.
function uploadBookFiles(req, res, next) {
    parseBookFiles(req, res, async (err) => {
        if (err) {
            if (err instanceof UploadError || err instanceof multer.MulterError) {
                return res.status(400).json({ message: uploadErrorMessage(err) });
            }
            return next(err);
        }

        try {
            const cover = req.files?.cover?.[0];
            if (cover && !(await hasImageSignature(cover))) {
                cleanUpFiles(req.files);
                return res.status(400).json({ message: 'Файл обложки повреждён или не является изображением' });
            }
            next();
        } catch (checkErr) {
            cleanUpFiles(req.files);
            next(checkErr);
        }
    });
}

module.exports = {
    COVER_UPLOAD_DIR,

    uploadBookFiles,

    cleanUpFiles,

    // Значение для Book.coverPath — по аналогии с Book.path
    toCoverPath: (file) => `${COVER_URL_PREFIX}/${file.filename}`,

    // Путь к файлу обложки на диске. basename не даёт выйти за пределы
    // uploads/covers, даже если в БД окажется что-то неожиданное.
    coverFsPath: (coverPath) => coverPath ? path.join(COVER_UPLOAD_DIR, path.basename(coverPath)) : null,

    deleteFile: (path) => {
        if (!path) return;

        try {
            fs.unlinkSync(path);
        } catch (err) {
            console.error('Error deleting file: ', err);
        }
    }
};
