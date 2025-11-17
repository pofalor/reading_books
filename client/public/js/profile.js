// Валидация формы профиля
document.addEventListener('DOMContentLoaded', function() {
    const profileForm = document.querySelector('.profile-form');
    
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            
            if (!firstName || !lastName) {
                e.preventDefault();
                showAlert('Пожалуйста, заполните все поля', 'error');
                return;
            }
            
            if (firstName.length < 2 || lastName.length < 2) {
                e.preventDefault();
                showAlert('Имя и фамилия должны содержать минимум 2 символа', 'error');
                return;
            }
            
            // Показываем индикатор загрузки
            const submitBtn = profileForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
            submitBtn.disabled = true;
            
            // Восстанавливаем кнопку через 3 секунды на случай ошибки
            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 3000);
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