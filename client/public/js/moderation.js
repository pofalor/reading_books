import { setupModal } from './shared/modal.js';
import { getAuthorFullName } from './shared/utlis/author.utils.js';
import { getAuthorName } from './shared/utlis/author.utils.js';

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
        await loadAllBooks();
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

  async function loadAllBooks(search = "", limit = 100) {
    try {
      const body = { search, limit };
      const response = await fetch('/api/books/getAll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ body })
      });
      if (response.ok) {
        const data = await response.json();
        state.books = data.hidden ? [] : data;
      }
    } catch (error) {
      console.error('Error loading all books: ', error);
      state.books = [];
    }
  }

  async function loadAllAuthors(search = "", limit = 100) {
    try {
      const body = { search, limit };
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

  async function loadAllGenres(search = "", limit = 100) {
    try {
      const body = { search, limit };
      const response = await fetch('/api/genres/getAll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ body })
      });
      if (response.ok) {
        const data = await response.json();
        state.genres = data;
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
    updateTable('all-books', state.books, generateAllBooksRow);

    const descriptionModal = setupModal('description-modal', '.close');
    setupBookDescrModal(descriptionModal);

    setupDownloadBookBtn();

    document.querySelectorAll('.approve-book-btn').forEach(btn => {
      btn.addEventListener('click', () => approveBook(btn.dataset.id));
    });

    document.querySelectorAll('.delete-book-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteBook(btn.dataset.id));
    });
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
            <table class="w-100">
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
      case 'all-books':
        return `
                    <th>Название</th>
                    <th>Автор</th>
                    <th>Статус</th>
                    <th>Дата создания</th>
                    <th>Описание</th>
                    <th>Цена</th>
                    <th>Доступна гостям</th>
                    <th>Дата публикации</th>
                    <th>Жанры</th>
                    <th>Файл книги</th>
                    <th>Действия</th>
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

  function generateAllBooksRow(book) {
    let approveButton = "";
    if (!book.isConfirmed) {
      const isCurrentUserCreator = currentUser.id === book.creatorId;
      const approveButtonDisabled = isCurrentUserCreator ? 'disabled' : '';
      const approveButtonClass = isCurrentUserCreator ? 'btn secondary' : 'btn primary';
      approveButton = `<button class="${approveButtonClass} approve-book-btn" data-id="${book.id}" ${approveButtonDisabled} title="Подтвердить">
                    <i class="fas fa-check"></i>
                    </button>`;
    }

    return `
            <tr>
                <td>${escapeHtml(book.title)}</td>
                <td>${escapeHtml(getAuthorName(book.Author))}</td>
                <td style="color: ${book.isConfirmed ? "green" : "blue"}">${book.isConfirmed ? 'Подтверждена' : 'На модерации'}</td>
                <td>${new Date(book.createdAt).toLocaleDateString()}</td>
                <td>
                  <button class="btn primary book-description-button" data-description="${escapeHtml(book.description || 'Описание отсутствует')}">
                      Описание
                  </button>
                </td>
                <td>${!book.price ? 'Бесплатно' : book.price}</td>
                <td>${book.guestAvailable ? 'Да' : 'Нет'}</td>
                <td>${book.formattedPublicationDate}</td>
                <td>
                    ${book.Genres ? book.Genres.map(genre => `
                        <span class="list-badge">${genre.name}</span>
                    `).join('') : ''}
                </td>
                <td>
                  <button class="btn primary download-book-button" data-book-id="${book.id}">
                      Скачать
                  </button>
                </td>
                <td class="d-flex" style="min-width: 150px;">
                    ${approveButton}
                    <button class="btn danger delete-book-btn" data-id="${book.id}" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
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
      // Поиск книг
      setupSearch('book-search', 'search-books-btn', loadAllBooks);

      // Показ имени выбранного файла
      document.getElementById('book-file').addEventListener('change', function (e) {
        const fileName = e.target.files[0]?.name || 'Файл не выбран';
        document.getElementById('file-name').textContent = fileName;
      });
    }

    // Обработчики для авторов
    if (state.activeTab === 'authors') {
      // Поиск авторов
      setupSearch('author-search', 'search-authors-btn', loadAllAuthors);
    }

    // Обработчики для жанров
    if (state.activeTab === 'genres') {
      // Поиск авторов
      setupSearch('genre-search', 'search-genres-btn', loadAllGenres);
    }
  }

  function setupSearch(inputId, buttonId, searchMethod) {
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);

    const performSearch = async () => {
      const limit = 100;
      const search = input.value.trim();

      try {
        await searchMethod(search, limit);
        updateUI();
      } catch (error) {
        console.error('Search error: ', error);
        alert(`Ошибка при поиске`);
      }
    };

    button.addEventListener('click', performSearch);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performSearch();
    });
  }

  function setupModalHandlers() {
    if (state.activeTab === 'books') {
      setupBookModal();
    }
    if (state.activeTab === 'authors') {
      setupAuthorModal('add-author-btn', true);
    }
    // Обработчики для авторов
    if (state.activeTab === 'genres') {
      setupGenreModal('add-genre-btn', true);
    }
  }

  function setupBookModal() {
    const modal = document.getElementById('add-book-modal');
    const openBtn = document.getElementById('add-book-btn'); // Предполагается, что такая кнопка есть
    const closeBtn = modal.querySelector('.close');
    const form = document.getElementById('add-book-form');

    if (!modal) return;

    // Функция для открытия модального окна
    const openModal = () => {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';

      // Анимация появления
      setTimeout(() => {
        modal.style.opacity = '1';
        modal.querySelector('.modal-content').style.transform = 'translateY(0)';
      }, 10);

      document.getElementById('book-title').focus();
    };

    // Функция для закрытия модального окна
    const closeModal = (needReset = false) => {
      modal.style.opacity = '0';
      modal.querySelector('.modal-content').style.transform = 'translateY(-20px)';

      setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        if (needReset) form.reset();
      }, 300);
    };

    // Обработчики открытия модального окна
    if (openBtn) {
      openBtn.addEventListener('click', openModal);
    }

    // Обработчики закрытия модального окна
    closeBtn.addEventListener('click', () => closeModal(false));

    // Закрытие по клику вне модалки
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(false);
    });

    // Обработка выбора файла
    const fileInput = document.getElementById('book-file');
    const fileNameDisplay = document.getElementById('file-name');

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        fileNameDisplay.textContent = fileInput.files[0].name;
      } else {
        fileNameDisplay.textContent = 'Файл не выбран';
      }
    });

    // Обработчик для кнопки добавления нового автора
    setupAuthorModal('add-new-author', false);

    // Обработчик для кнопки добавления нового жанра
    setupGenreModal('add-new-genre', false);

    // Обработка отправки формы
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Сбор данных формы
      const formData = new FormData();
      formData.append('title', document.getElementById('book-title').value.trim());
      formData.append('publicationDay', document.getElementById('pub-day').value || null);
      formData.append('publicationMonth', document.getElementById('pub-month').value || null);
      formData.append('publicationYear', document.getElementById('pub-year').value || null);
      formData.append('description', document.getElementById('book-description').value.trim() || null);
      formData.append('price', document.getElementById('book-price').value);
      formData.append('isGuestAvailable', document.getElementById('book-guest-available').checked);
      formData.append('authorId', document.querySelector('.dropdown-selector-item.selected')?.dataset?.value);

      // Добавляем файл, если он есть
      if (fileInput.files.length > 0) {
        formData.append('file', fileInput.files[0]);
      }

      // Добавляем жанры
      const selectedGenres = JSON.parse(document.getElementById('genres-select-value').value).map(item => item.value);

      // Валидация обязательных полей
      if (!formData.get('title')) {
        alert('Название книги обязательно для заполнения');
        return;
      }

      if (!fileInput.files.length) {
        alert('Файл книги обязателен для добавления');
        return;
      }

      if (!formData.get('authorId')) {
        alert('Необходимо выбрать автора');
        return;
      }

      if (selectedGenres.length === 0) {
        alert('Необходимо выбрать хотя бы один жанр');
        return;
      }

      formData.append('genres', selectedGenres);

      // Показываем индикатор загрузки
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
      submitBtn.disabled = true;

      try {
        // Отправка на сервер
        const response = await fetch('/api/books', {
          method: 'POST',
          body: formData
        });

        // Обработка ответа
        if (response.ok) {
          // Очистка выбора
          const dropdown = document.querySelector('#multi-select-dropdown-genres-select');
          const clearEvent = new Event('clearDropdown');
          dropdown.dispatchEvent(clearEvent);

          alert('Книга успешно добавлена');
          closeModal(true);
          await loadAllBooks();
          updateBooksUI();
          fileNameDisplay.textContent = 'Файл не выбран';
        } else {
          const error = await response.json();
          alert(error.message || 'Ошибка добавления книги');
        }
      } catch (error) {
        console.error('Error: ', error);
        alert('Произошла ошибка при добавлении книги');
      } finally {
        // Восстанавливаем кнопку
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
      }
    });
  }

  function setupAuthorModal(openBtnId, needRefreshAfterClose) {
    const modal = document.getElementById('add-author-modal');
    const openBtn = document.getElementById(openBtnId);
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
          if (needRefreshAfterClose) {
            await loadAllAuthors();
            updateAuthorsUI();
          }

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
  function setupGenreModal(openBtnId, needRefreshAfterClose) {
    const modal = document.getElementById('add-genre-modal');
    const openBtn = document.getElementById(openBtnId);
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
          closeModal(true);
          if (needRefreshAfterClose) {
            await loadAllGenres();
            updateGenresUI();
          }
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

  function setupBookDescrModal(descriptionModal) {
    // Открытие модального окна с описаникм
    document.querySelectorAll('.book-description-button').forEach(btn => {
      btn.addEventListener('click', () => {
        const descr = btn.dataset.description;
        const descrContent = document.getElementById('description-content');

        descrContent.textContent = descr;
        descriptionModal.style.display = 'block';
      });
    });
  }

  function setupDownloadBookBtn() {
    // Открытие модального окна с описаникм
    document.querySelectorAll('.download-book-button').forEach(btn => {
      btn.addEventListener('click', async () => {
        const bookId = btn.dataset.bookId;
        try {
          // Отправляем запрос на скачивание
          const response = await fetch(`/api/books/download?bookId=${bookId}`);

          if (response.ok) {
            // Получаем имя файла из заголовков
            const contentDisposition = response.headers.get('Content-Disposition');
            const filename = contentDisposition
              ? contentDisposition.split('filename=')[1].replace(/"/g, '')
              : `book_${bookId}.epub`;

            // Создаем blob и скачиваем файл
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }
          else {
            const error = await response.json();
            alert(error.message || 'Ошибка при скачивании книги');
          }
        } catch (error) {
          console.error('Download error: ', error);
          alert('Произошла ошибка при скачивании книги');
        }
      });
    });
  }

  async function approveBook(bookId) {
    try {
      const response = await fetch(`/api/books/approve?bookId=${bookId}`);

      if (response.ok) {
        alert('Книга успешно подтверждена');

        // Обновляем данные
        await loadAllBooks();
        updateBooksUI();
      }
      else {
        const error = await response.json();
        alert(error.message || 'Ошибка подтверждения книги');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert(error.message || 'Ошибка при подтверждении книги');
    }
  }

  async function deleteBook(bookId) {
    try {
      if (!confirm('Вы уверены, что хотите удалить эту книгу?')) return;

      const response = await fetch(`/api/books?bookId=${bookId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Книга успешно удалена');

        // Обновляем данные
        await loadAllBooks();
        updateBooksUI();
      }
      else {
        const error = await response.json();
        alert(error.message || 'Ошибка удаления книги');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert(error.message || 'Ошибка при удалении книги');
    }
  }

  function escapeHtml(unsafe) {
    return unsafe ? unsafe.toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;") : '';
  }
});