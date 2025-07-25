/**
* Форматирует дату из отдельных компонентов
* @param {number|null} day - День (1-31)
* @param {number|null} month - Месяц (1-12)
* @param {number|null} year - Год (полный)
* @returns {string|null} Дата в формате DD.MM.YYYY, "месяц год" или '—' если год не указан
*/
export function formatDate(day, month, year) {
    if (!year) return '—';

    if (day && !month) return '—';

    // Названия месяцев
    const monthNames = [
        'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
        'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'
    ];

    // Если есть день - возвращаем в формате DD.MM.YYYY
    if (day) {
        const normalizedDay = String(day).padStart(2, '0');
        const normalizedMonth = month ? String(month).padStart(2, '0') : '';
        return `${normalizedDay}.${normalizedMonth}.${year}`;
    }

    // Если нет дня, но есть месяц - возвращаем "месяц год"
    if (month) {
        const monthName = monthNames[month - 1] || '';
        return `${monthName} ${year}`;
    }

    // Если только год
    return String(year);
}