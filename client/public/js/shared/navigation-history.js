class NavigationHistory {
    constructor() {
        this.key = 'navHistory';
        this.init();
        this.updateBackButtonVisibility();
    }

    init() {
        // Инициализируем историю если её нет
        if (!sessionStorage.getItem(this.key)) {
            sessionStorage.setItem(this.key, JSON.stringify([]));
        }
        
        // Добавляем текущую страницу в историю
        this.addCurrentPage();
    }

    addCurrentPage() {
        const history = this.getHistory();
        const currentPage = {
            url: window.location.href,
            title: document.title,
            timestamp: Date.now()
        };

        // Не добавляем дубликаты подряд
        if (history.length === 0 || history[history.length - 1].url !== currentPage.url) {
            history.push(currentPage);
            
            // Ограничиваем размер истории (последние 30 страниц)
            if (history.length > 30) {
                history.shift();
            }
            
            sessionStorage.setItem(this.key, JSON.stringify(history));
            this.updateBackButtonVisibility();
        }
    }

    getHistory() {
        return JSON.parse(sessionStorage.getItem(this.key) || '[]');
    }

    goBack() {
        const history = this.getHistory();
        
        // Удаляем текущую страницу из истории
        if (history.length > 0) {
            history.pop(); // Удаляем текущую страницу
            sessionStorage.setItem(this.key, JSON.stringify(history));
        }
        
        const previousPage = history.length < 1 ? null : history[history.length - 1];
        if (previousPage) {
            // Переходим на предыдущую страницу
            window.location.href = previousPage.url;
        }
    }

    updateBackButtonVisibility() {
        const backButton = document.getElementById('back-button');
        if (backButton) {
            const history = this.getHistory();
            // Показываем кнопку только если есть куда возвращаться
            backButton.style.display = history.length > 1 ? 'block' : 'none';
        }
    }
}

// Использование
const navHistory = new NavigationHistory();

// Кнопка назад
document.getElementById('back-button')?.addEventListener('click', function() {
    navHistory.goBack();
});

// Обновляем историю при навигации (если используется SPA)
window.addEventListener('popstate', function() {
    navHistory.addCurrentPage();
});