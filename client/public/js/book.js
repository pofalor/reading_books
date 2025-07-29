document.addEventListener('DOMContentLoaded', function () {
    const readBtn = document.getElementById('read-btn');
    const shelfBtn = document.getElementById('shelf-btn');
    const modal = document.getElementById('auth-modal');
    const closeModal = document.querySelector('.close-modal');
    const modalMessage = document.getElementById('modal-message');

    // Обработчик для кнопки "Читать"
    readBtn.addEventListener('click', function () {
        if (locals.user) {
            // Проверяем доступность книги для пользователя
            if (book.guestAvailable || (locals.user && !book.price) || (locals.user && userPurchased)) {
                window.location.href = "= book.path ";
            } else {
                modalMessage.textContent = "Эта книга недоступна для бесплатного чтения. Вы можете купить её.";
                modal.style.display = "block";
            }
        } else {
            modalMessage.textContent = "Для чтения этой книги необходимо войти в систему или купить её.";
            modal.style.display = "block";
        }
    });

    // Обработчик для кнопки "На полку"
    shelfBtn.addEventListener('click', function () {
        if (locals.user) {
            // AJAX запрос для добавления/удаления с полки
            fetch('/api/shelf/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ bookId: book.id })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        shelfBtn.textContent = data.onShelf ? 'Убрать с полки' : 'На полку';
                    }
                });
        } else {
            modalMessage.textContent = "Для добавления книги на полку необходимо войти в систему.";
            modal.style.display = "block";
        }
    });

    // Закрытие модального окна
    closeModal.addEventListener('click', function () {
        modal.style.display = "none";
    });

    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
});