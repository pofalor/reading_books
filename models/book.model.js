const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    //Книга
    class Book extends Model {

        static async getFeatured(limit = 10) {
            return this.findAll({
                where: {
                    isConfirmed: true
                },
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                include: [
                    {
                        model: sequelize.models.Author,
                        attributes: ['id', 'firstName', 'secondName', 'surname', 'nickName']
                    },
                    {
                        model: sequelize.models.Genre,
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
        publicationDay: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                isDay(value) {
                    if (value !== null && (value < 1 || value > 31)) {
                        throw new Error('День должен быть между 1 и 31');
                    }
                }
            }
        },
        publicationMonth: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                isMonth(value) {
                    if (value !== null && (value < 1 || value > 12)) {
                        throw new Error('Месяц должен быть между 1 и 12');
                    }
                }
            }
        },
        publicationYear: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                isYear(value) {
                    const currentYear = new Date().getFullYear();
                    if (value !== null && (value < 1 || value > currentYear)) {
                        throw new Error(`Год должен быть между 1 и ${currentYear}`);
                    }
                }
            }
        },
        description: {
            type: DataTypes.TEXT
        },
        path: {
            type: DataTypes.STRING,
            allowNull: false
        },
        authorId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'authors',
                key: 'id'
            },
            allowNull: false
        },
        price: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        guestAvailable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        creatorId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'users',
                key: 'id'
            },
            allowNull: false
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'Book',
        tableName: 'books',
        timestamps: false,
        validate: {
            dependentFields() {
                if (this.publicationDay !== null && (this.publicationMonth === null || this.publicationYear === null)) {
                    throw new Error('Для указания дня необходимо указать месяц и год');
                }

                if (this.publicationMonth !== null && this.publicationYear === null) {
                    throw new Error('Для указания месяца необходимо указать год');
                }

                // Проверка корректности даты (например, 31 февраля)
                if (this.publicationDay && this.publicationMonth && this.publicationYear) {
                    const lastDayOfMonth = new Date(
                        this.publicationYear,
                        this.publicationMonth,
                        0
                    ).getDate();

                    if (this.publicationDay > lastDayOfMonth) {
                        throw new Error(`В выбранном месяце только ${lastDayOfMonth} дней`);
                    }
                }
            }
        }
    });

    return Book;
};