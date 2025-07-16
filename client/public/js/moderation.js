document.addEventListener('DOMContentLoaded', async () => {
  let pendingBooks = [];
  let allBooks = [];

  // Инициализация страницы
  try {
    await initPage();
    setupEventListeners();
  } catch (error) {
    alert('Ошибка инициализации страницы');
  }

  async function initPage() {
    await loadPendingBooks();
    await loadAllBooks();
    updateUI();
  }

  async function loadPendingBooks() {
    try {
      const response = await fetch('/api/books/pending', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        pendingBooks = data.hidden ? [] : data;
      }
    } catch (error) {
      console.error('Error loading pending books: ', error);
    }
  }

  async function loadAllBooks() {
    try {
      const response = await fetch('/api/books?limit=100');
      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      allBooks = data.hidden ? [] : data;
    } catch (error) {
      console.error('Error loading all books:', error);
    }
  }

  async function approveBook(bookId) {
    try {
      const response = await fetch('/api/books/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve book');
      }

      const updatedBook = await response.json();
      pendingBooks = pendingBooks.filter(book => book.id !== bookId);
      allBooks.unshift(updatedBook);

      alert('Книга успешно подтверждена');
      updateUI();
    } catch (error) {
      console.error('Error approving book:', error);
      alert('Ошибка подтверждения книги');
    }
  }

  function updateUI() {
    updatePendingBooksTable();
    updateAllBooksTable();
  }

  function updatePendingBooksTable() {
    const container = document.getElementById('pending-books-container');
    const table = document.getElementById('pending-books-table');
    const noDataMessage = document.getElementById('no-pending-books');

    if (pendingBooks.length === 0) {
      table.style.display = 'none';
      noDataMessage.style.display = 'block';
      return;
    }

    table.style.display = 'block';
    noDataMessage.style.display = 'none';

    table.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Название</th>
                        <th>Автор</th>
                        <th>Создатель</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${pendingBooks.map(book => `
                        <tr>
                            <td>${escapeHtml(book.title)}</td>
                            <td>${escapeHtml(getAuthorName(book.Author))}</td>
                            <td>${escapeHtml(`${book.Creator.firstName} ${book.Creator.lastName}`)}</td>
                            <td>
                                <button class="action-btn approve-btn" data-id="${book.id}">
                                    Подтвердить
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
  }

  function updateAllBooksTable() {
    const container = document.getElementById('all-books-container');
    const table = document.getElementById('all-books-table');
    const noDataMessage = document.getElementById('no-books');

    if (allBooks.length === 0) {
      table.style.display = 'none';
      noDataMessage.style.display = 'block';
      return;
    }

    table.style.display = 'block';
    noDataMessage.style.display = 'none';

    table.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Название</th>
                        <th>Автор</th>
                        <th>Статус</th>
                        <th>Дата создания</th>
                    </tr>
                </thead>
                <tbody>
                    ${allBooks.map(book => `
                        <tr>
                            <td>${escapeHtml(book.title)}</td>
                            <td>${escapeHtml(getAuthorName(book.Author))}</td>
                            <td>${book.isConfirmed ? 'Подтверждена' : 'На модерации'}</td>
                            <td>${new Date(book.createdAt).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
  }

  function setupEventListeners() {
    // Подтверждение книги
    document.addEventListener('click', async (e) => {
      if (e.target.classList.contains('approve-btn')) {
        const bookId = parseInt(e.target.dataset.id);
        await approveBook(bookId);
      }
    });

    // Поиск книг
    const searchInput = document.getElementById('book-search');
    const searchButton = document.getElementById('search-books-btn');

    const performSearch = async () => {
      const searchTerm = searchInput.value.trim();
      if (searchTerm.length < 2) return;

      try {
        const response = await fetch(`/api/books/search?q=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) throw new Error('Search failed');

        const data = await response.json();
        allBooks = data.hidden ? [] : data;
        updateAllBooksTable();
      } catch (error) {
        console.error('Search error:', error);
        alert('Ошибка поиска книг');
      }
    };

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performSearch();
    });

    // Добавление новой книги
    document.getElementById('add-book-btn').addEventListener('click', () => {
      // Реализация открытия модального окна
      showAddBookModal();
    });
  }

  // Вспомогательные функции
  function getAuthorName(author) {
    return author.nickName || `${author.firstName} ${author.surname}`;
  }

  function escapeHtml(unsafe) {
    return unsafe
      .toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showAddBookModal() {
    // Реализация модального окна добавления книги
    console.log('Show add book modal');
  }
});