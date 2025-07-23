document.addEventListener('DOMContentLoaded', () => {
    // Инициализация всех dropdown-селекторов на странице
    document.querySelectorAll('.dropdown-selector').forEach(initDropdownSelector);
});

function initDropdownSelector(container) {
    const input = container.querySelector('.dropdown-selector-input');
    const dropdown = container.querySelector('.dropdown-selector-list');
    const valueField = container.dataset.valueField;
    const descriptionField = container.dataset.descriptionField;
    const hiddenInput = container.querySelector('input[type="hidden"]');

    const apiUrl = container.dataset.apiUrl;
    const displayField = container.dataset.displayField;
    const method = container.dataset.method;

    // Обработчики событий 
    ['input', 'focus'].forEach(type => {
        input.addEventListener(type, async (e) => {
            const searchTerm = e.target.value?.trim()?.toLowerCase();
            const body = { search: searchTerm, limit: 100 };
            try {
                const response = await fetch(apiUrl, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: method === 'POST' ? JSON.stringify({ body }) : undefined
                });
                if (response.ok) {
                    const items = await response.json();
                    const filtered = items.filter(item =>
                        (item[displayField]?.toLowerCase().includes(searchTerm) || !searchTerm));

                    renderItems(filtered);
                }
            } catch (error) {
                console.error('Dropdown error:', error);
                showError('Ошибка загрузки данных');
            }
        });
    });

    // Обработчик выбора элемента
    dropdown.addEventListener('click', handleSelect);

    // Закрытие dropdown при клике вне его
    document.addEventListener('click', handleOutsideClick);

    // Обработчик нажатия клавиш
    input.addEventListener('keydown', handleKeyDown);

    // Обработчик кастомного события для очистки
    container.addEventListener('clearDropdown', () => {
        input.value = '';
        hiddenInput.value = '';
        dropdown.innerHTML = '';
        dropdown.style.display = 'none';
        container.querySelectorAll('.dropdown-selector-item').forEach(el => {
            el.classList.remove('selected');
        });
    });

    function handleOutsideClick(e) {
        if (!container.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    }

    function renderItems(items) {
        if (items.length > 0) {
            dropdown.innerHTML = items.map(item => `
        <div class="dropdown-selector-item" 
             data-value="${item[valueField]}" 
             data-display="${item[displayField]}">
          ${item[displayField]} 
          ${item[descriptionField] ? `<small>${item[descriptionField]}</small>` : ''}
        </div>
      `).join('');
            dropdown.style.display = 'block';
        } else {
            showNoResults();
        }
    }

    function handleSelect(e) {
        const item = e.target.closest('.dropdown-selector-item');
        if (!item || item.classList.contains('no-results')) return;

        // Установка выбранного значения
        input.value = item.dataset.display;
        hiddenInput.value = item.dataset.value;

        // Закрытие dropdown
        dropdown.style.display = 'none';

        // Подсветка выбранного элемента
        container.querySelectorAll('.dropdown-selector-item').forEach(el => {
            el.classList.remove('selected');
        });
        item.classList.add('selected');

        // Генерация события изменения
        const event = new Event('change', { bubbles: true });
        hiddenInput.dispatchEvent(event);
    }

    function handleKeyDown(e) {
        // Закрытие по ESC
        if (e.key === 'Escape') {
            dropdown.style.display = 'none';
            input.blur();
            return;
        }

        // Навигация по элементам стрелками
        if (['ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
            const items = container.querySelectorAll('.dropdown-selector-item:not(.no-results):not(.error)');
            if (items.length === 0) return;

            const currentIndex = Array.from(items).findIndex(item =>
                item.classList.contains('selected')
            );

            let newIndex = currentIndex;

            if (e.key === 'ArrowUp') {
                newIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
            } else if (e.key === 'ArrowDown') {
                newIndex = currentIndex >= items.length - 1 ? 0 : currentIndex + 1;
            } else if (e.key === 'Enter' && currentIndex >= 0) {
                items[currentIndex].click();
                return;
            }

            items.forEach(item => item.classList.remove('selected'));
            items[newIndex].classList.add('selected');
            items[newIndex].scrollIntoView({ block: 'nearest' });

            e.preventDefault();
        }
    }

    function showNoResults() {
        dropdown.innerHTML = '<div class="dropdown-selector-item no-results">Элементы не найдены</div>';
        dropdown.style.display = 'block';
    }

    function showError(message) {
        dropdown.innerHTML = `<div class="dropdown-selector-item error">${message}</div>`;
        dropdown.style.display = 'block';
    }
}