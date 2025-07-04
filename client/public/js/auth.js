document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Простая валидация
        if (!email || !password) {
            alert('Пожалуйста, заполните все поля');
            return;
        }

        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
            .then(response => response.json())
            .then(data => {
                if (data.token) {
                    window.location.href = '/';
                }
                if(data.message){
                    alert(data.message);
                }
            })
    });
});

// Регистрация
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = {
            firstName: document.getElementById('first-name').value,
            lastName: document.getElementById('last-name').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            confirmPassword: document.getElementById('confirm-password').value
        };

        // Валидация
        if (!formData.firstName || !formData.lastName || !formData.email ||
            !formData.password || !formData.confirmPassword) {
            alert('Пожалуйста, заполните все поля');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            alert('Пароли не совпадают');
            return;
        }

        if (formData.password.length < 8) {
            alert('Пароль должен содержать не менее 8 символов');
            return;
        }

        if (!document.getElementById('agree-terms').checked) {
            alert('Необходимо принять условия использования');
            return;
        }

        // Эмуляция отправки данных
        console.log('Отправка данных регистрации:', formData);

        fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.token) {
                    window.location.href = '/    ';
                }
            });

    });

    // Индикатор сложности пароля
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function () {
            const strengthBar = document.querySelector('.password-strength-bar');
            if (!strengthBar) return;

            const strength = calculatePasswordStrength(this.value);
            strengthBar.style.width = strength.percent + '%';
            strengthBar.style.backgroundColor = strength.color;
        });
    }
}

function calculatePasswordStrength(password) {
    let strength = 0;

    // Длина пароля
    if (password.length > 10) strength += 40;
    else if (password.length > 7) strength += 25;
    else if (password.length > 4) strength += 10;

    // Содержит цифры
    if (/\d/.test(password)) strength += 20;

    // Содержит спецсимволы
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 20;

    // Содержит буквы разного регистра
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 20;

    // Ограничиваем 100%
    strength = Math.min(strength, 100);

    // Определяем цвет
    let color;
    if (strength < 40) color = '#ff4d4d';
    else if (strength < 70) color = '#ffa64d';
    else color = '#4dff4d';

    return { percent: strength, color };
}