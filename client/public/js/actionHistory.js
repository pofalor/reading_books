document.addEventListener('DOMContentLoaded', async () => {
    // Загрузка списка пользователей
    async function loadHistory() {
        try {
            const beginDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            const limit = 1000;
            const search = document.getElementById('history-search').value;
            const response = await fetch('/api/history/getAll', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ search, limit, beginDate, endDate })
            });

            if (response.ok) {
                const data = await response.json();
                renderHistory(data);
            } else {
                console.error('Ошибка загрузки журнала');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Произошла ошибка при получении данных');
        }
    }

    // Рендер списка пользователей
    function renderHistory(historyArr) {
        const tbody = document.getElementById('history-table-body');
        const table = document.getElementById("history-table");
        const noDataMessage = document.getElementById(`no-history`);

        if (!historyArr || historyArr.length === 0) {
            table.style.display = 'none';
            noDataMessage.style.display = 'block';
            return;
        }

        tbody.innerHTML = historyArr.map(action => `
            <tr>
                <td>${action.id}</td>
                <td>${action.actionType}</td>
                <td>${action.description}</td>
                <td>${action.Actor ? `${action.Actor.firstName} ${action.Actor.lastName} (${action.Actor.email})` : '-'}</td>
                <td>${action.User ? `${action.User.firstName} ${action.User.lastName} (${action.User.email})` : '-'}</td>
                <td>${action.Author ? `${action.Author.firstName} ${action.Author.lastName} (${action.Author.nickName})` : '-'}</td>
                <td>${action.Book ? action.Book.title : '-'}</td>
                <td>${action.Genre ? action.Genre.name : '-'}</td>
                <td>${new Date(action.timestamp).toLocaleString()}</td>
            </tr>`).join('');

        table.style.display = 'block';
        noDataMessage.style.display = 'none';
    }

    // Обработка кнопки поиска
    document.getElementById('search-button-history').addEventListener('click', () => {
        loadHistory();
    });

    document.getElementById('reset-filter')?.addEventListener('click', () => {
        document.getElementById('start-date').value = '';
        document.getElementById('end-date').value = '';
        document.getElementById('history-search').value = '';
    });

    // Инициализация
    await loadHistory();
});