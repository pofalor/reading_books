document.addEventListener('DOMContentLoaded', function () {
    const removeButtons = document.querySelectorAll('.remove-from-shelf');
    const bookCards = document.querySelectorAll('.clickable-card');

    removeButtons.forEach(button => {
        button.addEventListener('click', async function (e) {
            e.stopPropagation(); // Предотвращаем всплытие события до карточки

            if (!confirm('Вы действительно хотите убрать книгу с полки?')) {
                return;
            }

            const bookId = this.getAttribute('data-book-id');
            const card = this.closest('.book-card');

            try {
                const response = await fetch(`/api/userBook?bookId=${bookId}`, {
                    method: 'DELETE'
                });

                const content = await response.json();
                if (response.ok && content.success) {
                    card.style.opacity = '0';
                    setTimeout(() => card.remove(), 300);

                    // Обновляем количество книг, если нужно
                    const booksGrid = document.querySelector('.books-grid');
                    if (booksGrid && booksGrid.children.length === 0) {
                        location.reload();
                    }
                } else {
                    alert(content.message || 'Не удалось убрать книгу с полки');
                }
            } catch (error) {
                console.error('Ошибка:', error);
                alert('Произошла ошибка при удалении книги');
            }
        });

        // Обработчик клика по карточке
        bookCards.forEach(card => {
            card.addEventListener('click', function (e) {
                // Проверяем, что клик был не по кнопке или ссылке внутри карточки
                if (!e.target.closest('.book-actions a, .book-actions button')) {
                    const bookId = this.getAttribute('data-id');
                    window.location.href = `/book?bookId=${bookId}`;
                }
            });
        });
    });
});