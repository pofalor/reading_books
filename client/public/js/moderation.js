document.addEventListener('DOMContentLoaded', async () => {
  // Состояние приложения
  const state = {
    activeTab: getActiveTab(),
    books: [],
    authors: [],
    genres: []
  };
  let currentUser = null;

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
        await loadAllAuthors();
        break;
      case 'genres':
        await loadAllGenres();
        break;
    }
    // Получаем текущего пользователя
    try {
      const response = await fetch('/api/auth/profile');
      if (response.ok) {
        currentUser = await response.json();
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
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
        state.books = data.hidden ? [] : data;
      }
    } catch (error) {
      console.error('Error loading all books: ', error);
      state.books = [];
    }
  }

  async function loadAllAuthors(search = "") {
    try {
      const body = { search, limit: 100 };
      const response = await fetch('/api/authors/getAll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ body })
      });
      if (response.ok) {
        const data = await response.json();
        state.authors = data.hidden ? [] : data;
      }
    } catch (error) {
      console.error('Error loading all authors: ', error);
      state.authors = [];
    }
  }

  async function loadAllGenres(search = "") {
    try {
      const body = { search, limit: 100 };
      const response = await fetch('/api/genres/getAll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ body })
      });
      if (response.ok) {
        const data = await response.json();
        state.genres = data.hidden ? [] : data;
      }
    } catch (error) {
      state.genres = [];
      console.error('Error loading all genres: ', error);
    }
  }

  function updateUI() {
    if (state.activeTab === 'books') {
      updateBooksUI();
    } else if (state.activeTab === 'authors') {
      updateAuthorsUI();
    } else if (state.activeTab === 'genres') {
      updateGenresUI();
    }
  }

  function updateBooksUI() {
    updateTable('pending-books', state.books.pending, generatePendingBooksRow);
    updateTable('all-books', state.books, generateAllBooksRow);
  }

  function updateAuthorsUI() {
    updateTable('all-authors', state.authors, generateAllAuthorsRow);

    document.querySelectorAll('.approve-author-btn').forEach(btn => {
      btn.addEventListener('click', () => approveAuthor(btn.dataset.id));
    });

    document.querySelectorAll('.delete-author-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteAuthor(btn.dataset.id));
    });

    setupAuthorBioModal();
  }

  function updateGenresUI() {
    updateTable('genres', state.genres, generateAllGenresRow);

    document.querySelectorAll('.delete-genre-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteGenre(btn.dataset.id));
    });
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
      case 'all-authors':
        return `
                    <th>Имя</th>
                    <th>Псевдоним</th>
                    <th>Статус</th>
                    <th>Дата рождения</th>
                    <th>Дата регистрации</th>
                    <th>Биография</th>
                    <th>Действия</th>
                `;
      case 'genres':
        return `
                    <th style="width: 20%">Название</th>
                    <th style="width: 60%">Описание</th>
                    <th style="width: 20%">Действия</th>
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

  function generateAllAuthorsRow(author) {
    let approveButton = "";
    if (!author.isConfirmed) {
      const isCurrentUserCreator = currentUser.id === author.creatorId;
      const approveButtonDisabled = isCurrentUserCreator ? 'disabled' : '';
      const approveButtonClass = isCurrentUserCreator ? 'btn secondary' : 'btn primary';
      approveButton = `<button class="${approveButtonClass} approve-author-btn" data-id="${author.id}" ${approveButtonDisabled}>
                        Подтвердить
                      </button>`
    }

    return `
            <tr>
                <td>${escapeHtml(getAuthorFullName(author))}</td>
                <td>${escapeHtml(author.nickName || '—')}</td>
                <td style="color: ${author.isConfirmed ? "green" : "blue"}">${author.isConfirmed ? 'Подтвержден' : 'На модерации'}</td>
                <td>${author.birthDate ? new Date(author.birthDate).toLocaleDateString() : '—'}</td>
                <td>${new Date(author.createdAt).toLocaleDateString()}</td>
                <td>
                  <button class="btn primary author-bio-button" data-bio="${escapeHtml(author.bio || 'Биография отсутствует')}">
                      Биография
                  </button>
                </td>
                <td class="d-flex">
                    ${approveButton}
                    <button class="btn danger delete-author-btn" data-id="${author.id}">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                </td>
            </tr>
        `;
  }

  function generateAllGenresRow(genre) {
    return `
      <tr>
        <td>${escapeHtml(genre.name)}</td>
        <td>${escapeHtml(genre.description || '—')}</td>
        <td>
            <button class="btn danger delete-genre-btn" data-id="${genre.id}">
                <i class="fas fa-trash"></i> Удалить
            </button>
        </td>
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
    }

    // Обработчики для авторов
    if (state.activeTab === 'authors') {
      // Поиск авторов
      setupSearch('author-search', 'search-authors-btn', '/api/authors/getAll', 'authors');
    }

    // Обработчики для жанров
    if (state.activeTab === 'genres') {
      // Поиск авторов
      setupSearch('genre-search', 'search-genres-btn', '/api/genres/getAll', 'genres');
    }
  }

  function setupSearch(inputId, buttonId, endpoint, dataType) {
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);

    const performSearch = async () => {
      const limit = 100;
      const search = input.value.trim();

      try {
        const body = { search, limit };
        const response = await fetch(`${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ body })
        });
        if (!response.ok) throw new Error('Search failed');

        const data = await response.json();
        state[dataType] = data.hidden ? [] : data;
        updateUI();
      } catch (error) {
        console.error('Search error:', error);
        alert(`Ошибка поиска ${dataType === 'books' ? 'книг' : 'авторов'}`);
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
    // Обработчики для авторов
    if (state.activeTab === 'genres') {
      setupGenreModal();
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
    const closeModal = (needReset) => {
      modal.style.display = 'none';
      if (needReset) form.reset();
    };

    closeBtn.addEventListener('click', closeModal, false);
    modal.querySelector('.close').addEventListener('click', closeModal, false);

    // Закрытие по клику вне модалки
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(false);
    });

    // Обработка отправки формы
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const payload = {
        nickName: document.getElementById('author-nickname').value.trim(),
        firstName: document.getElementById('author-first-name').value.trim() || null,
        secondName: document.getElementById('author-second-name').value.trim() || null,
        surname: document.getElementById('author-surname').value.trim() || null,
        birthDate: document.getElementById('author-birth-date').value.trim() || null,
        bio: document.getElementById('author-bio').value.trim() || null
      }

      // Валидация обязательных полей
      if (!payload.nickName) {
        alert('Псевдоним обязателен для заполнения');
        return;
      }

      // Показываем индикатор загрузки
      const submitBtn = document.querySelector("button[form='add-author-form'][type='submit']");
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
      submitBtn.disabled = true;

      try {
        // Отправка на сервер
        const response = await fetch('/api/authors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        // Обработка ответа
        if (response.ok) {
          alert('Автор успешно добавлен');
          // Закрываем модальное окно
          closeModal();
          await loadAllAuthors();
          updateAuthorsUI();
        } else {
          const error = await response.json();
          alert(error.message || 'Ошибка добавления автора');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Произошла ошибка при добавлении автора');
      } finally {
        // Восстанавливаем кнопку
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
      }
    });
  }

  function setupAuthorBioModal() {
    // Открытие модального окна с биографией
    document.querySelectorAll('.author-bio-button').forEach(btn => {
      btn.addEventListener('click', () => {
        const bio = btn.dataset.bio;
        const modal = document.getElementById('bio-modal');
        const bioContent = document.getElementById('bio-content');

        bioContent.textContent = bio; // или bioContent.innerHTML = bio, если поддерживается HTML
        modal.style.display = 'block';
      });
    });

    // Закрытие модального окна
    document.querySelector('.close').addEventListener('click', function () {
      document.getElementById('bio-modal').style.display = 'none';
    });

    // Закрытие при клике вне модалки
    window.addEventListener('click', function (e) {
      const modal = document.getElementById('bio-modal');
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }

  async function approveAuthor(authorId) {
    try {
      const response = await fetch('/api/authors/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ authorId })
      });

      if (response.ok) {
        alert('Автор успешно подтверждён');

        // Обновляем данные
        await loadAllAuthors();
        updateAuthorsUI();
      }
      else {
        const error = await response.json();
        alert(error.message || 'Ошибка подтверждения автора');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert(error.message || 'Ошибка при подтверждении автора');
    }
  }

  async function deleteAuthor(authorId) {
    try {
      if (!confirm('Вы уверены, что хотите удалить этого автора?')) return;

      const response = await fetch(`/api/authors/delete?authorId=${authorId}`);

      if (response.ok) {
        alert('Автор успешно удалён');

        // Обновляем данные
        await loadAllAuthors();
        updateAuthorsUI();
      }
      else {
        const error = await response.json();
        alert(error.message || 'Ошибка удаления автора');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert(error.message || 'Ошибка при удалении автора');
    }
  }

  // Управление модалкой жанра
  function setupGenreModal() {
    const modal = document.getElementById('add-genre-modal');
    const openBtn = document.getElementById('add-genre-btn');
    const closeBtn = document.getElementById('cancel-genre-btn');
    const form = document.getElementById('add-genre-form');

    if (!modal || !openBtn) return;

    // Открытие модалки
    openBtn.addEventListener('click', () => {
      modal.style.display = 'block';
      document.getElementById('genre-name').focus();
    });

    // Закрытие модалки
    const closeModal = (needReset) => {
      modal.style.display = 'none';
      if (needReset) form.reset();
    };

    closeBtn.addEventListener('click', closeModal, false);
    modal.querySelector('.close').addEventListener('click', closeModal, false);

    // Закрытие по клику вне модалки
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(false);
    });

    // Обработка отправки формы
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const payload = {
        name: document.getElementById('genre-name').value.trim(),
        description: document.getElementById('genre-description').value.trim() || null
      }

      // Валидация обязательных полей
      if (!payload.name) {
        alert('Название обязательно для заполнения');
        return;
      }

      const submitBtn = document.querySelector('button[form="add-genre-form"][type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
      submitBtn.disabled = true;

      try {
        const response = await fetch('/api/genres', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        // Обработка ответа
        if (response.ok) {
          alert('Жанр успешно добавлен');
          closeModal();
          await loadAllGenres();
          updateGenresUI();
        } else {
          const error = await response.json();
          alert(error.message || 'Ошибка добавления жанра');
        }
      } catch (error) {
        console.error('Ошибка: ', error);
        alert(error.message || 'Ошибка при добавлении жанра');
      } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // Удаление жанра
  async function deleteGenre(genreId) {
    if (!confirm('Вы уверены, что хотите удалить этот жанр?')) return;

    try {
      const response = await fetch(`/api/genres?genreId=${genreId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Жанр успешно удалён');
        await loadAllGenres();
        updateGenresUI();
      }
      else {
        const error = await response.json();
        alert(error.message || 'Ошибка удаления жанра');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert(error.message || 'Ошибка при удалении жанра');
    }
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