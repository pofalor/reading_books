// Основной файл приложения
$(document).ready(async function () {
    // Инициализация приложения
    await initApp();
});

async function initApp() {
    // Проверка аутентификации
    await checkAuthStatus();

    // Мобильное меню
    document.querySelector('.mobile-menu-btn').addEventListener('click', function () {
        document.querySelector('.nav-links').classList.toggle('active');
    });

    document.querySelectorAll('.logout-link')?.forEach(x=> {
        x.addEventListener('click', async function (e) {
            e.preventDefault();

            try {
                const response = await fetch('api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
            
                if (response.ok) {
                    window.location.href = '/'; // Перенаправляем после успешного выхода
                } else {
                    const error = await response.json();
                    alert(error.message || 'Ошибка при выходе');
                }
            } catch (error) {
                console.error('Error: ', error);
                alert(error.message || 'Ошибка при выходе');
            }
        });
    });

    // Мобильное меню
    document.querySelector('.user-profile').addEventListener('click', function () {
        window.location.href = `/profile`;
    });
}

async function checkAuthStatus() {
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