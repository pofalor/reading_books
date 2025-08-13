// Основной файл приложения
$(document).ready(function () {
    // Инициализация приложения
    // Обработка клика по книге
    $('.book-card').click(function () {
        const bookId = $(this).data('id');
        window.location.href = `/book?bookId=${bookId}`;
    });
});