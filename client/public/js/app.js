// Основной файл приложения
$(document).ready(function() {
    // Инициализация приложения
    initApp();
});

function initApp() {
    // Проверка аутентификации
    checkAuthStatus();
    
    // Инициализация страниц
    if ($('#books-container').length) {
        initHomePage();
    }
    
    if ($('#reader-content').length) {
        initBookReader();
    }
    
    if ($('#shelf-books-container').length) {
        initShelfPage();
    }
    
    if ($('#auth-container').length) {
        initAuthPage();
    }
}

function checkAuthStatus() {
    const token = localStorage.getItem('bookAppToken');
    if (token) {
        // Пользователь авторизован
        $('.auth-only').show();
        $('.guest-only').hide();
    } else {
        // Пользователь не авторизован
        $('.auth-only').hide();
        $('.guest-only').show();
    }
}

// Навигация
function navigateTo(page) {
    window.location.href = `/${page}`;
}

// API вызовы
const api = {
    getBooks: function(params = {}) {
        return $.ajax({
            url: '/api/books',
            method: 'GET',
            data: params
        });
    },
    
    getBook: function(id) {
        return $.ajax({
            url: `/api/books/${id}`,
            method: 'GET'
        });
    },
    
    // Другие методы API...
};