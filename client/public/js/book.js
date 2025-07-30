import { setupModal } from "./shared/modal.js";

document.addEventListener('DOMContentLoaded', function () {
    const pageContainer = document.querySelector('.page-container');
    const book = JSON.parse(pageContainer.dataset.book);
    const user = pageContainer.dataset.user ? JSON.parse(pageContainer.dataset.user) : null;
    const modal = setupModal('auth-modal', '.close');
    const modalMessage = document.getElementById('modal-message');

    setupReadBtn();
    setupBuyBtn();
    setupShelfBtn();

    // Обработчик для кнопки "На полку"
    function setupShelfBtn() {
        const shelfBtn = document.getElementById('shelf-btn');

        shelfBtn.addEventListener('click', async function () {
            if (user) {
                // Проверяем, является ли книга платной и не куплена ли она
                if (book.price && book.price > 0 && !book.transaction?.id) {
                    modalMessage.textContent = "Для добавления этой книги на полку необходимо её купить.";
                    modal.style.display = "block";
                    return;
                }

                const response = await fetch(`/api/userBook?bookId=${book.id}`);

                if (response.ok) {
                    alert('Книга успешно добавлена на полку');
                    const content = await response.json();
                    shelfBtn.textContent = content.status === 'Deleted' ? 'На полку' : 'Убрать с полки';
                }
                else {
                    const error = await response.json();
                    alert(error.message || 'Ошибка добавления книги на полку');
                }
            } else {
                modalMessage.textContent = "Для добавления книги на полку необходимо войти в систему.";
                modal.style.display = "block";
            }
        });
    }

    // Обработчик для кнопки "Купить"
    function setupBuyBtn() {
        const buyBtn = document.getElementById('buy-btn');
        if (buyBtn) {
            buyBtn.addEventListener('click', function () {
                if (user) {
                    window.location.href = `/purchase/${book.id}`;
                } else {
                    modalMessage.textContent = "Для покупки книги необходимо войти в систему.";
                    modal.style.display = "block";
                }
            });
        }
    }

    // Обработчик для кнопки "Читать"
    function setupReadBtn() {
        const readBtn = document.getElementById('read-btn');

        if (readBtn) {
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
        }
    }
});

