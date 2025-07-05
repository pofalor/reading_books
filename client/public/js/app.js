// Основной файл приложения
$(document).ready(function () {
    // Инициализация приложения
    initApp();
});

function initApp() {
    // Проверка аутентификации
    checkAuthStatus();
}

function checkAuthStatus() {
    fetch('/api/auth/isAuthorized', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data) {
                // Пользователь авторизован
                $('.auth-only').show();
                $('.guest-only').hide();
            }
            else {
                // Пользователь не авторизован
                $('.auth-only').hide();
                $('.guest-only').show();
            }
        });
}