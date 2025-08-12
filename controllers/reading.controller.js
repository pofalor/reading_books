const { UserBook, Book } = require('../models');
const path = require('path');
const Epub = require('epub');

exports.getReaderPage = async (req, res) => {
    try {
        const { bookId } = req.query;
        const userId = req.user?.id;
        const book = req.book;

        if(!book){
            return res.status(404).send('Книга не найдена');
        }

        // Получаем прогресс чтения
        let currentPage = 1;
        let currentStatus = null;
        if (req.user) {
            const [userBook, created] = await UserBook.findOrCreate({
                where: { userId, bookId },
                defaults: {
                    userId,
                    bookId,
                    status: 'InProgress',
                    currentPage: 1,
                    addedAt: new Date(),
                    lastUpdated: new Date()
                }
            });

            if (!created && userBook.status !== 'InProgress') {
                userBook.status = 'InProgress';
                await userBook.save();
            }
            currentStatus = userBook.status;
            currentPage = userBook.currentPage;
        }

        const epubPath = path.join(__dirname, '..', book.path);
        
        const epub = new Epub(epubPath);

        //TODO: убрать выдачу пользователям контента всей книги
        epub.on('end', async () => {
            res.render('reader', {
                book,
                metadata: epub.metadata,
                spine: epub.spine,
                toc: epub.toc,
                currentPage,
                user: req.user,
                isSidebarOpen: true,
                currentStatus
            });
        });

        epub.parse();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

exports.getPageContent = async (req, res) => {
    try {
        const { bookId, pageId } = req.query;
        const book = req.book;

        if (!book) {
            return res.status(404).send('Книга не найдена');
        }

        const epubPath = path.join(__dirname, '..', book.path);
        const epub = new Epub(epubPath);
        
        epub.on('end', () => {
            epub.getChapter(pageId, async (error, text) => {
                if (error) {
                    //TODO: писать логи в файл
                    console.error(`Произошла ошибка при открытии файла. bookId=${bookId}, pageId=${pageId}), 
                        userId=${req.user?.id}, error: ${error}`);
                    return res.status(404).send('Ошибка при открытии файла');
                }

                // Обновляем прогресс для зарегистрированных пользователей
                if (req.user) {
                    const spineIndex = epub.spine.contents.findIndex(item => item.id === pageId);
                    await UserBook.updateReadingProgress(req.user.id, bookId, spineIndex + 1);
                }

                res.send(text);
            });
        });

        epub.parse();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};