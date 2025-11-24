import {getUserFullName} from './shared/utlis/entity.utils.js';

// Валидация формы профиля
document.addEventListener('DOMContentLoaded', function() {
    const profileForm = document.querySelector('.profile-form');
    
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const firstNameEl = document.getElementById('firstName');
            const lastNameEl = document.getElementById('lastName')
            const firstName = firstNameEl.value.trim();
            const lastName = lastNameEl.value.trim();
            
            if (!firstName || !lastName) {
                
                showAlert('Пожалуйста, заполните все поля', 'error');
                return;
            }

            if (firstName.length < 2) {
                showAlert('Имя должно содержать минимум 2 символа', 'error');
                return;
            }

            if (lastName.length < 2) {
                showAlert('Фамилия должна содержать минимум 2 символа', 'error');
                return;
            }

            if (firstName.length > 50) {
                showAlert('Максимальная длина имени 50 символов', 'error');
                return;
            }

            if (lastName.length > 50) {
                showAlert('Максимальная длина фамилии 50 символов', 'error');
                return;
            }
            
            // Показываем индикатор загрузки
            const submitBtn = profileForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
            submitBtn.disabled = true;

            try {

                // Отправка на сервер
                const response = await fetch('/api/profile/update', {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ firstName, lastName})
                });

                // Обработка ответа
                if (response.ok) {                
                  var resp = await response.json();
                  firstNameEl.value = resp.firstName;
                  lastNameEl.value = resp.lastName;
                  document.getElementById('userFullName').textContent = getUserFullName(resp);
                  alert('Данные успешно изменены');
                } else {
                  const error = await response.json();
                  alert(error.message || 'Произошла ошибка при изменении');
                }
            } catch (error) {
              console.error('Error: ', error);
              alert('Произошла ошибка при изменении');
            } finally {
              // Восстанавливаем кнопку
               submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    function showAlert(message, type) {
        // Удаляем существующие алерты
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
            ${message}
        `;
        
        const container = document.querySelector('.profile-container');
        const title = container.querySelector('h1');
        container.insertBefore(alert, title.nextSibling);
        
        // Автоматически скрываем через 5 секунд
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
});