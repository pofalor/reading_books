import { setupModal } from "./shared/modal.js";

document.addEventListener('DOMContentLoaded', function () {
    const pageContainer = document.querySelector('.page-container');
    const book = JSON.parse(pageContainer.dataset.book);
    const user = pageContainer.dataset.user ? JSON.parse(pageContainer.dataset.user ) : null;
    const readBtn = document.getElementById('read-btn');
    const shelfBtn = document.getElementById('shelf-btn');
    const modal = setupModal('auth-modal', '.close');
    const modalMessage = document.getElementById('modal-message');

    // Обработчик для кнопки "Читать"
    readBtn.addEventListener('click', function () {
        // Проверяем доступность книги для пользователя
        if (book.guestAvailable || (user && !book.price) || (user && book.transaction.id)) {
            window.location.href = `/read/${book.id}`;
        }
        else if (!user) {
            modalMessage.textContent = "Для чтения этой книги необходимо войти в систему.";
            modal.style.display = "block";
        }
        else {
            modalMessage.textContent = "Эта книга недоступна для бесплатного чтения. Вы можете купить её.";
            modal.style.display = "block";
        }
    });

    // Обработчик для кнопки "На полку"
    shelfBtn.addEventListener('click', function () {
        if (user) {
            // AJAX запрос для добавления/удаления с полки
            fetch(`/api/userBook/${book.id}`)
            .then(response => response.json())
            .then(data => {
                if (data) {
                    shelfBtn.textContent = data.status === 'Deleted'  ? 'На полку' : 'Убрать с полки';
                }
            });
        } else {
            modalMessage.textContent = "Для добавления книги на полку необходимо войти в систему.";
            modal.style.display = "block";
        }
    });
});