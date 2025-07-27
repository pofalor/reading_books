// Вспомогательные функции
export function getAuthorName(author) {
    return author.nickName || `${author.firstName} ${author.surname}`;
}

export function getAuthorFullName(author) {
    return `${author.firstName} ${author.secondName || ''} ${author.surname}`.trim();
}