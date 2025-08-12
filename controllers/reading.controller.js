const path = require('path');
const Epub = require('epub');
const { Book, Genre, Author, Transaction } = require('../models');

exports.getReaderPage = async (req, res) => {
    try {
        const { bookId } = req.query;
        const userId = res.locals?.user?.id ?? null;

        if (!bookId) {
            return res.status(404).send('Книга не найдена');
        }

        const book = await Book.findByPk(bookId, {
            include: [
                {
                    model: Author,
                    attributes: ['id', 'firstName', 'secondName', 'surname', 'nickName'],
                },
                {
                    model: Genre,
                    through: { attributes: [] }, // Исключаем промежуточную таблицу
                    attributes: ['name']
                },
                {
                    model: Transaction,
                    where: {
                        bookId: bookId,
                        userId: userId,
                        status: 'COMPLETED',
                        type: 'PURCHASE'
                    },
                    required: false,
                    attributes: ['id']
                }]
        });

        if (!book) {
            return res.status(404).send('Книга не найдена');
        }

        // Проверка доступа
        if (!book.guestAvailable && !userId) {
            return res.status(401).render('error-401', {
                title: 'Ошибка 401',
                errorTitle: 'Доступ запрещен',
                needLoginButton: true,
                needRegisterButton: true,
                errorMessage: `Для просмотра этой страницы необходимо авторизоваться. 
                            Пожалуйста, войдите в систему или зарегистрируйтесь.`,
                needAdditionalButton: false
            });
        }

        //если книга платная, то нужно проверить куплена ли она
        if (book.price && !book.Transactions.some()) {
            return res.status(401).render('error-401', {
                title: 'Ошибка 401',
                errorTitle: 'Доступ запрещен',
                errorMessage: `Для того, чтобы читать эту книгу, необходимо её купить.`,
                needAdditionalButton: true,
                addButtonHref: `/purchase/${book.id}`,
                addButtonClass: "btn accent",
                addButtonText: `Купить за ${book.price.toFixed(2)} ₽`,
                addButtonIcon: "fas fa-cart-shopping"
            });
        }

        if (!book) {
            return res.status(404).send('Книга не найдена');
        }

        const epubPath = path.join(__dirname, '..', book.path);
        const epub = new Epub(epubPath);

        epub.on('end', async () => {
            // Получаем весь контент книги
            const bookContent = await this.getAllBookContent(epub);

            res.render('reader', {
                book,
                metadata: epub.metadata,
                spine: epub.spine,
                toc: epub.toc,
                bookContent, // Добавляем полный контент книги
                user: req.user
            });
        });

        epub.parse();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// Вспомогательная функция для получения всего контента книги
exports.getAllBookContent = async (epub) => {
    return new Promise((resolve, reject) => {
        const contents = [];
        let processed = 0;

        epub.spine.contents.forEach((item, index) => {
            epub.getChapter(item.id, (error, text) => {
                if (error) {
                    console.error(`Error getting chapter ${item.id}:`, error);
                    text = `<p>Ошибка загрузки главы</p>`;
                }

                contents[index] = {
                    id: item.id,
                    content: text
                };

                processed++;

                if (processed === epub.spine.contents.length) {
                    resolve(contents);
                }
            });
        });
    });
};