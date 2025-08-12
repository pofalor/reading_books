import { getAuthorName } from './shared/utlis/entity.utils.js';

class BookReader {
    constructor() {
        const urlParams = new URLSearchParams(window.location.search);
        this.bookId = urlParams.get('bookId');
        this.currentPageIndex = parseInt(document.getElementById('current-page').textContent) || 1;
        this.totalPages = parseInt(document.getElementById('total-pages').textContent) || 1;
        this.isSidebarOpen = true;

        const activeItem = document.querySelector('.toc-list .toc-item.active');
        const currentPage = activeItem.dataset.id;

        this.initElements();
        this.initEvents();
        this.loadPage(currentPage);
    }

    initElements() {
        this.sidebar = document.querySelector('.reader-sidebar');
        this.sidebarToggle = document.getElementById('sidebar-toggle');
        this.bookContent = document.getElementById('book-content');
        this.prevBtn = document.getElementById('prev-page');
        this.nextBtn = document.getElementById('next-page');
        this.currentPageEl = document.getElementById('current-page');
        this.tocItems = document.querySelectorAll('.toc-item');
    }

    initEvents() {
        this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        this.prevBtn.addEventListener('click', () => this.goToPrevPage());
        this.nextBtn.addEventListener('click', () => this.goToNextPage());

        this.tocItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = e.target.getAttribute('data-id');
                const spineIndex = Array.from(this.tocItems).findIndex(i => i.getAttribute('data-id') === pageId);
                this.goToPage(spineIndex + 1);
            });
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.goToPrevPage();
            if (e.key === 'ArrowRight') this.goToNextPage();
        });
    }

    toggleSidebar() {
        this.isSidebarOpen = !this.isSidebarOpen;
        this.sidebar.classList.toggle('open', this.isSidebarOpen);
    }

    async loadPage(pageNumber) {
        if (pageNumber < 1 || pageNumber > this.totalPages) return;

        try {
            const response = await fetch(`/api/reading/pages?bookId=${this.bookId}&pageId=${pageNumber}`);
            if (!response.ok) throw new Error('Ошибка загрузки страницы');

            const content = await response.text();
            this.bookContent.innerHTML = content;
            this.currentPageIndex = pageNumber;
            this.currentPageEl.textContent = pageNumber;

            // Обновляем активный элемент в оглавлении
            this.tocItems.forEach(item => item.classList.remove('active'));
            const activeItem = document.querySelector(`.toc-item[data-id="${pageNumber}"]`);
            if (activeItem) activeItem.classList.add('active');

            // Прокручиваем к началу страницы
            window.scrollTo(0, 0);

            // Сохраняем прогресс (если пользователь авторизован)
            if (document.body.classList.contains('logged-in')) {
                await this.saveProgress(pageNumber);
            }
        } catch (error) {
            console.error('Ошибка загрузки страницы:', error);
            this.bookContent.innerHTML = '<p>Ошибка загрузки страницы. Пожалуйста, попробуйте позже.</p>';
        }
    }

    async saveProgress(pageNumber) {
        try {
            const response = await fetch(`/api/books/${this.bookId}/progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPage: pageNumber
                })
            });

            if (!response.ok) throw new Error('Ошибка сохранения прогресса');
        } catch (error) {
            console.error('Ошибка сохранения прогресса:', error);
        }
    }

    goToPage(pageNumber) {
        this.loadPage(pageNumber);
    }

    goToPrevPage() {
        this.goToPage(this.currentPageIndex - 1);
    }

    goToNextPage() {
        this.goToPage(this.currentPageIndex + 1);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BookReader();
});
