// Валидация формы профиля
document.addEventListener('DOMContentLoaded', function() {
    const profileForm = document.querySelector('.profile-form');
    
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            
            if (!firstName || !lastName) {
                e.preventDefault();
                showAlert('Пожалуйста, заполните все поля', 'error');
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
                  body: JSON.stringify({ firstName, lastName})
                });

                // Обработка ответа
                if (response.ok) {                
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