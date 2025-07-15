$(document).ready(function() {
  // Загрузка книг на модерации
  function loadPendingBooks() {
    $.get('/api/moderation/pending-books', function(data) {
      let html = '<table><thead><tr><th>Название</th><th>Автор</th><th>Создатель</th><th>Действия</th></tr></thead><tbody>';
      
      data.forEach(book => {
        const authorName = book.Author.nickName || 
          `${book.Author.firstName} ${book.Author.surname}`;
        
        html += `<tr>
          <td>${book.title}</td>
          <td>${authorName}</td>
          <td>${book.creator.firstName} ${book.creator.lastName}</td>
          <td>
            <button class="action-btn approve-btn" data-id="${book.id}">Подтвердить</button>
          </td>
        </tr>`;
      });
      
      html += '</tbody></table>';
      $('#pending-books-table').html(html);
    }).fail(error => {
      console.error('Ошибка загрузки книг:', error);
    });
  }
  
  // Подтверждение книги
  $(document).on('click', '.approve-btn', function() {
    const bookId = $(this).data('id');
    
    $.post('/api/moderation/approve-book', { bookId }, function() {
      loadPendingBooks();
      showToast('Книга успешно подтверждена', 'success');
    }).fail(error => {
      showToast(error.responseJSON?.message || 'Ошибка подтверждения книги', 'error');
    });
  });
  
  // Инициализация
  loadPendingBooks();
  
  // Вспомогательная функция для уведомлений
  function showToast(message, type = 'info') {
    // Реализация toast-уведомлений
  }
});