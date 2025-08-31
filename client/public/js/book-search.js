import { getAuthorName } from "./shared/utlis/entity.utils.js";

class BookSearch {
    constructor() {
        this.filters = {
            title: '',
            author: '',
            genres: []
        };
        
        this.initElements();
        this.initEvents();
        this.updateFilters();
        this.loadBooks();
    }

    initElements() {
        this.form = document.getElementById('search-form');
        this.titleInput = document.getElementById('title-input');
        this.authorSelect = document.getElementById('author-select-value');
        this.authorInput = document.getElementById('author-select-input');
        this.genresSelect = document.getElementById('genres-select-value');
        this.booksGrid = document.getElementById('books-grid');
        this.resultsCount = document.getElementById('results-count');
        this.loading = document.getElementById('loading');
        this.noResults = document.getElementById('no-results');
        this.resetButton = document.getElementById('reset-filters');
    }

    initEvents() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateFilters();
            this.loadBooks();
        });

        this.resetButton.addEventListener('click', () => {
            this.resetFilters();
        });
    }

    updateFilters() {
        this.filters = {
            title: this.titleInput.value,
            author: this.authorInput.value,
            genres: this.genresSelect.value?.length ? JSON.parse(this.genresSelect.value).map(item => item.value) : []
        };
    }

    resetFilters() {
        this.titleInput.value = '';
        this.authorSelect.value = '';
        this.authorInput.value = '';
        this.genresSelect.value = '';
        
        // Сбрасываем через события, чтобы обновить UI компонентов
        const clearEvent = new Event('clearDropdown');

        const dropdown = document.querySelector('#dropdown-selector-author-select');
        dropdown.dispatchEvent(clearEvent);

        const multidropDown = document.querySelector('#multi-select-dropdown-genres-select');
        multidropDown.dispatchEvent(clearEvent);
        
        this.filters = { title: '', author: '', genres: [] };
        this.loadBooks();
    }

    async loadBooks() {
        this.showLoading();
        
        try {
            const body = {
                title: this.filters.title,
                author: this.filters.author,
                genres: this.filters.genres.join(','),
                limit: 1000
            };

            const response = await fetch(`/api/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            const books = await response.json();

            this.renderResults(books);
        } catch (error) {
            console.error('Ошибка загрузки книг:', error);
            this.showError();
        }
    }

    renderResults(books) {
        this.hideLoading();
        
        if (books.length === 0) {
            this.showNoResults();
            return;
        }

        this.resultsCount.textContent = `Найдено книг: ${books.length}`;

        // Показываем предупреждение, если результатов много
        const tooManyResults = document.getElementById('too-many-results');
        if (books.length >= 1000) {
            tooManyResults.style.display = 'block';
        } else {
            tooManyResults.style.display = 'none';
        }

        this.booksGrid.innerHTML = books.map(book => `
            <div class="book-card" data-id="${book.id}">
                <img src="${book.coverUrl || '/images/default-book.jpg'}" alt="${book.title}">
                <div class="book-card-content">
                    <h3>${book.title}</h3>
                    <p>${book.Author ? getAuthorName(book.Author) : 'Автор неизвестен'}</p>
                    ${book.Genres && book.Genres.length > 0 ? `
                        <div class="genres">
                            ${book.Genres.slice(0, 3).map(genre => `
                                <span class="list-badge">${genre.name}</span>
                            `).join('')}
                            ${book.Genres.length > 3 ? `
                                <span class="list-badge">+${book.Genres.length - 3}</span>
                            ` : ''}
                        </div>
                    ` : ''}
                    <a href="/book?bookId=${book.id}" class="btn small">Подробнее</a>
                </div>
            </div>
            `).join('');

        // Добавляем обработчики клика по карточкам
        document.querySelectorAll('.book-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.btn') && !e.target.closest('.list-badge')) {
                    const bookId = card.dataset.id;
                    window.location.href = `/book?bookId=${bookId}`;
                }
            });
        });
    }

    showLoading() {
        this.loading.style.display = 'block';
        this.noResults.style.display = 'none';
        this.booksGrid.innerHTML = '';
    }

    hideLoading() {
        this.loading.style.display = 'none';
    }

    showNoResults() {
        this.noResults.style.display = 'block';
        this.booksGrid.innerHTML = '';
        this.resultsCount.textContent = '';
    }

    showError() {
        this.booksGrid.innerHTML = '<p class="error">Произошла ошибка при загрузке книг</p>';
        this.resultsCount.textContent = '';
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new BookSearch();
});