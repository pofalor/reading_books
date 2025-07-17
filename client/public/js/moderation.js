document.addEventListener('DOMContentLoaded', async () => {
  // Состояние приложения
  const state = {
    activeTab: getActiveTab(),
    books: {
      pending: [],
      all: []
    },
    authors: {
      pending: [],
      all: []
    }
  };

  // Инициализация страницы
  try {
    await loadDataForCurrentTab();
    setupEventListeners();
    setupModalHandlers();
  } catch (error) {
    console.error('Initialization error: ', error);
  }

  // Функции
  function getActiveTab() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tab') || 'books';
  }

  async function loadDataForCurrentTab() {
    switch (state.activeTab) {
      case 'books':
        await Promise.all([
          loadPendingBooks(),
          loadAllBooks()
        ]);
        break;
      case 'authors':
        await Promise.all([
          loadPendingAuthors(),
          loadAllAuthors()
        ]);
        break;
      case 'genres':
        await loadAllGenres();
        break;
    }
    updateUI();
  }

  async function loadPendingBooks() {
    try {
      const response = await fetch('/api/books/pending');
      if (response.ok) {
        const data = await response.json();
        state.books.pending = data.hidden ? [] : data;
      }
    } catch (error) {
      throw error;
    }
  }

  async function loadAllBooks() {
    try {
      const response = await fetch('/api/books?limit=100');
      if (response.ok) {
        const data = await response.json();
        state.books.all = data.hidden ? [] : data;
      }
    } catch (error) {
      throw error;
    }
  }

  async function loadPendingAuthors() {
    try {
      const response = await fetch('/api/authors/pending');
      if (response.ok) {
        const data = await response.json();
        state.authors.pending = data.hidden ? [] : data;
      }
    } catch (error) {
      throw error;
    }
  }

  async function loadAllAuthors() {
    try {
      const response = await fetch('/api/authors/getAll?limit=100');
      if (response.ok) {
        const data = await response.json();
        state.authors.all = data.hidden ? [] : data;
      }
    } catch (error) {
      throw error;
    }
  }

  async function loadAllGenres() {
    // Реализация загрузки жанров
  }

  function updateUI() {
    if (state.activeTab === 'books') {
      updateBooksUI();
    } else if (state.activeTab === 'authors') {
      updateAuthorsUI();
    }
    // Можно добавить обработку жанров
  }

  function updateBooksUI() {
    updateTable('pending-books', state.books.pending, generatePendingBooksRow);
    updateTable('all-books', state.books.all, generateAllBooksRow);
  }

  function updateAuthorsUI() {
    updateTable('pending-authors', state.authors.pending, generatePendingAuthorsRow);
    updateTable('all-authors', state.authors.all, generateAllAuthorsRow);
  }

  function updateTable(tableId, data, rowGenerator) {
    const container = document.getElementById(`${tableId}-container`);
    const table = document.getElementById(`${tableId}-table`);
    const noDataMessage = document.getElementById(`no-${tableId}`);

    if (!data || data.length === 0) {
      table.style.display = 'none';
      noDataMessage.style.display = 'block';
      return;
    }

    table.innerHTML = `
            <table>
                <thead>
                    <tr>
                        ${getTableHeaders(tableId)}
                    </tr>
                </thead>
                <tbody>
                    ${data.map(item => rowGenerator(item)).join('')}
                </tbody>
            </table>
        `;

    table.style.display = 'block';
    noDataMessage.style.display = 'none';
  }

  function getTableHeaders(tableId) {
    switch (tableId) {
      case 'pending-books':
        return `
                    <th>Название</th>
                    <th>Автор</th>
                    <th>Создатель</th>
                    <th>Действия</th>
                `;
      case 'all-books':
        return `
                    <th>Название</th>
                    <th>Автор</th>
                    <th>Статус</th>
                    <th>Дата создания</th>
                `;
      case 'pending-authors':
        return `
                    <th>Имя</th>
                    <th>Псевдоним</th>
                    <th>Дата рождения</th>
                    <th>Действия</th>
                `;
      case 'all-authors':
        return `
                    <th>Имя</th>
                    <th>Псевдоним</th>
                    <th>Статус</th>
                    <th>Дата регистрации</th>
                `;
      default:
        return '';
    }
  }

  function generatePendingBooksRow(book) {
    return `
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
        `;
  }

  function generateAllBooksRow(book) {
    return `
            <tr>
                <td>${escapeHtml(book.title)}</td>
                <td>${escapeHtml(getAuthorName(book.Author))}</td>
                <td>${book.isConfirmed ? 'Подтверждена' : 'На модерации'}</td>
                <td>${new Date(book.createdAt).toLocaleDateString()}</td>
            </tr>
        `;
  }

  function generatePendingAuthorsRow(author) {
    return `
            <tr>
                <td>${escapeHtml(getAuthorFullName(author))}</td>
                <td>${escapeHtml(author.nickName || '—')}</td>
                <td>${author.birthDate ? new Date(author.birthDate).toLocaleDateString() : '—'}</td>
                <td>
                    <button class="action-btn approve-btn" data-id="${author.id}">
                        Подтвердить
                    </button>
                </td>
            </tr>
        `;
  }

  function generateAllAuthorsRow(author) {
    return `
            <tr>
                <td>${escapeHtml(getAuthorFullName(author))}</td>
                <td>${escapeHtml(author.nickName || '—')}</td>
                <td>${author.isConfirmed ? 'Подтвержден' : 'На модерации'}</td>
                <td>${new Date(author.createdAt).toLocaleDateString()}</td>
            </tr>
        `;
  }

  function setupEventListeners() {
    // Обработчики для вкладок
    document.querySelectorAll('.moderation-tabs .tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const tabName = tab.getAttribute('href').split('=')[1];
        window.location.href = `/moderation?tab=${tabName}`;
      });
    });

    // Обработчики для книг
    if (state.activeTab === 'books') {
      document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('approve-btn')) {
          const bookId = parseInt(e.target.dataset.id);
          await approveBook(bookId);
        }
      });

      // Поиск книг
      setupSearch('book-search', 'search-books-btn', '/api/books/search', 'books');

      // Показ имени выбранного файла
      document.getElementById('book-file').addEventListener('change', function (e) {
        const fileName = e.target.files[0]?.name || 'Файл не выбран';
        document.getElementById('file-name').textContent = fileName;
      });

      // Поиск авторов
      setupSearch('author-search', 'search-authors-btn', '/api/authors/search', 'authors');
    }

    // Обработчики для авторов
    if (state.activeTab === 'authors') {
      document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('approve-btn')) {
          const authorId = parseInt(e.target.dataset.id);
          await approveAuthor(authorId);
        }
      });
    }
  }

  function setupSearch(inputId, buttonId, endpoint, dataType) {
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);

    const performSearch = async () => {
      const searchTerm = input.value.trim();
      if (searchTerm.length < 2) return;

      try {
        const response = await fetch(`${endpoint}?q=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) throw new Error('Search failed');

        const data = await response.json();
        state[dataType].all = data.hidden ? [] : data;
        updateUI();
      } catch (error) {
        console.error('Search error:', error);
        showToast(`Ошибка поиска ${dataType === 'books' ? 'книг' : 'авторов'}`, 'error');
      }
    };

    button.addEventListener('click', performSearch);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performSearch();
    });
  }

  function setupModalHandlers() {
    if (state.activeTab === 'books') {
      // Обработчики событий
      document.getElementById('add-book-btn').addEventListener('click', showAddBookModal);
      document.querySelector('#add-book-modal .close').addEventListener('click', closeAddBookModal);

      // Закрытие по клику вне модалки
      window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('add-book-modal')) {
          closeAddBookModal();
        }
      });
    }
    if (state.activeTab === 'authors') {
      setupAuthorModal();
    }
  }

  // Показ модального окна
  function showAddBookModal() {
    const modal = document.getElementById('add-book-modal');
    modal.style.display = 'flex'; // Используем flex для центрирования
    document.body.style.overflow = 'hidden'; // Блокируем скролл страницы

    // Анимация появления
    setTimeout(() => {
      modal.style.opacity = '1';
      modal.querySelector('.modal-content').style.transform = 'translateY(0)';
    }, 10);
  }

  // Закрытие модального окна
  function closeAddBookModal() {
    const modal = document.getElementById('add-book-modal');
    modal.style.opacity = '0';
    modal.querySelector('.modal-content').style.transform = 'translateY(-20px)';

    setTimeout(() => {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }, 300);
  }

  function setupAuthorModal() {
    const modal = document.getElementById('add-author-modal');
    const openBtn = document.getElementById('add-author-btn');
    const closeBtn = document.getElementById('cancel-author-btn');
    const form = document.getElementById('add-author-form');

    if (!modal || !openBtn) return;

    // Открытие модалки
    openBtn.addEventListener('click', () => {
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden'; // Блокируем скролл страницы
      document.getElementById('author-first-name').focus();
    });

    // Закрытие модалки
    const closeModal = () => {
      modal.style.display = 'none';
      form.reset();
    };

    closeBtn.addEventListener('click', closeModal);
    modal.querySelector('.close').addEventListener('click', closeModal);

    // Закрытие по клику вне модалки
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Обработка отправки формы
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const authorData = {
        firstName: document.getElementById('author-first-name').value.trim(),
        secondName: document.getElementById('author-second-name').value.trim(),
        surname: document.getElementById('author-surname').value.trim(),
        nickName: document.getElementById('author-nickname').value.trim() || null,
        birthDate: document.getElementById('author-birth-date').value || null,
        bio: document.getElementById('author-bio').value.trim() || null
      };

      try {
        const response = await fetch('/api/authors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(authorData)
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const newAuthor = await response.json();
        showToast('Автор успешно добавлен', 'success');
        closeModal();

        // Обновляем список авторов если мы на вкладке авторов
        if (state.activeTab === 'authors') {
          await loadAllAuthors();
          await loadPendingAuthors();
          updateAuthorsUI();
        }

      } catch (error) {
        console.error('Error adding author:', error);
        showToast(error.message || 'Ошибка при добавлении автора', 'error');
      }
    });
  }

  // Вспомогательные функции
  function getAuthorName(author) {
    return author.nickName || `${author.firstName} ${author.surname}`;
  }

  function getAuthorFullName(author) {
    return `${author.firstName} ${author.secondName || ''} ${author.surname}`.trim();
  }

  function escapeHtml(unsafe) {
    return unsafe ? unsafe.toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;") : '';
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
});