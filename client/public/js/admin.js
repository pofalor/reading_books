document.addEventListener('DOMContentLoaded', async () => {
    // Загрузка списка администраторов
    async function loadUsers() {
        try {
            const search = "";

            fetch('/api/admin/getUsers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ search })
            })
                .then(response => response.json())
                .then(data => {
                    if (data) {
                        renderUsers(data);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Произошла ошибка при получении данных');
                });

        } catch (error) {
            alert(error.message);
        }
    }

    // Рендер списка
    function renderUsers(users) {
        const tbody = document.getElementById('admins-table-body');
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.firstName} ${user.lastName}</td>
                <td>${user.email}</td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn small danger" data-id="${user.id}">Удалить</button>
                </td>
            </tr>
        `).join('');
    }

    // Управление модальным окном
    const modal = document.getElementById('add-admin-modal');
    document.querySelector('.close').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Обработка формы
    document.getElementById('add-admin-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const adminData = {
            email: document.getElementById('admin-email').value,
            firstName: document.getElementById('admin-firstname').value,
            lastName: document.getElementById('admin-lastname').value,
            password: generateTempPassword() // Генерация временного пароля
        };

        try {
            const response = await fetch('/api/admin/getAdmins', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(adminData)
            });

            if (!response.ok) throw new Error('Ошибка создания');

            Toast.success('Администратор успешно добавлен');
            modal.style.display = 'none';
            loadUsers();
        } catch (error) {
            Toast.error(error.message);
        }
    });

    // Инициализация
    loadUsers();
});

function generateTempPassword() {
    return Math.random().toString(36).slice(-8);
}