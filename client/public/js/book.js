$(document).ready(function() {
    // Обработка кнопки чтения
    $('.read-btn').click(function() {
        const bookId = $(this).data('id');
        window.location.href = `/reader/${bookId}`;
    });

    // Обработка кнопки добавления на полку
    $('.add-btn').click(function() {
        const bookId = $(this).data('id');
        addToShelf(bookId);
    });

    // Обработка кнопки управления книгой на полке
    $('.shelf-btn').click(function() {
        const bookId = $(this).data('id');
        manageBookOnShelf(bookId);
    });
});

function addToShelf(bookId) {
    $.ajax({
        url: '/api/user/books',
        method: 'POST',
        data: { bookId },
        success: function(response) {
            showToast('Книга добавлена на вашу полку');
            setTimeout(() => location.reload(), 1000);
        },
        error: function(xhr) {
            showToast(xhr.responseJSON?.message || 'Ошибка добавления книги', 'error');
        }
    });
}

function manageBookOnShelf(bookId) {
    $.ajax({
        url: `/api/user/books/${bookId}`,
        method: 'DELETE',
        success: function(response) {
            showToast('Статус книги обновлен');
            setTimeout(() => location.reload(), 1000);
        },
        error: function(xhr) {
            showToast(xhr.responseJSON?.message || 'Ошибка обновления статуса', 'error');
        }
    });
}

function showToast(message, type = 'success') {
    const toast = $(`<div class="toast ${type}">${message}</div>`);
    $('body').append(toast);
    setTimeout(() => toast.remove(), 3000);
}