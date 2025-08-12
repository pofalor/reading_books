// Вспомогательные функции
export function getAuthorName(author) {
    return author.nickName || `${author.firstName} ${author.surname}`;
}

export function getAuthorFullName(author) {
    return `${author.firstName} ${author.secondName || ''} ${author.surname}`.trim();
}

export function formattedPublicationDate(publicationYear, publicationMonth, publicationDay) {
    if (!publicationYear) return '—';

    if (publicationDay && !publicationMonth) return '—';

    // Названия месяцев
    const monthNames = [
        'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
        'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'
    ];

    // Если есть день - возвращаем в формате DD.MM.YYYY
    if (publicationDay) {
        const normalizedDay = String(publicationDay).padStart(2, '0');
        const normalizedMonth = publicationMonth ? String(publicationMonth).padStart(2, '0') : '';
        return `${normalizedDay}.${normalizedMonth}.${publicationYear}`;
    }

    // Если нет дня, но есть месяц - возвращаем "месяц год"
    if (publicationMonth) {
        const monthName = monthNames[publicationMonth - 1] || '';
        return `${monthName} ${publicationYear}`;
    }

    // Если только год
    return String(publicationYear);
}
