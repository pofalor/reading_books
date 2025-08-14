import { setupModal } from './shared/modal.js';

document.addEventListener('DOMContentLoaded', async () => {
    let currentUser = null;
    let allRoles = [];

    // Проверяем роль текущего пользователя
    try {
        const response = await fetch('/api/auth/profile');
        if (response.ok) {
            currentUser = await response.json();
            if (currentUser && currentUser.roles.some(r => r === 'super_admin')) {
                document.getElementById('super-admin-buttons').style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error fetching current user:', error);
    }

    // Загрузка списка ролей
    async function loadRoles() {
        try {
            const response = await fetch('/api/admin/getRoles');
            if (response.ok) {
                allRoles = await response.json();
            }
        } catch (error) {
            console.error('Error loading roles:', error);
        }
    }

    // Загрузка списка пользователей
    async function loadUsers(search = "") {
        try {
            const response = await fetch('/api/admin/getUsers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ search })
            });

            if (response.ok) {
                const data = await response.json();
                renderUsers(data);
            } else {
                console.error('Error loading users');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Произошла ошибка при получении данных');
        }
    }

    // Рендер списка пользователей
    function renderUsers(users) {
        const tbody = document.getElementById('admins-table-body');
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.firstName} ${user.lastName}</td>
                <td>${user.email}</td>
                <td>
                    ${user.Roles ? user.Roles.map(role => `
                        <span class="list-badge">${role.name}</span>
                    `).join('') : ''}
                </td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                    ${currentUser && currentUser.roles.some(r => r === 'super_admin' || r === 'admin') ? `
                        <i class="action-icon add" data-userid="${user.id}" title="Добавить роль">➕</i>
                        <i class="action-icon remove" data-userid="${user.id}" title="Удалить роль">➖</i>
                    ` : ''}
                </td>
            </tr>
        `).join('');

        // Добавляем обработчики для иконок действий
        document.querySelectorAll('.action-icon.add').forEach(icon => {
            icon.addEventListener('click', () => openAddUserRoleModal(icon.dataset.userid));
        });

        document.querySelectorAll('.action-icon.remove').forEach(icon => {
            icon.addEventListener('click', () => openDeleteUserRoleModal(icon.dataset.userid));
        });
    }

    async function loadStats() {
        try {
            const beginDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            const limit = 50;

            const response = await fetch(`/api/admin/getStats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ limit, beginDate, endDate })
            });

            if (response.ok) {
                const data = await response.json();
                renderPurchaseStats(data.stats);
                renderPurchases(data.purchases);
            } else {
                console.error('Error loading purchase stats');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Произошла ошибка при загрузке статистики');
        }
    }

    // Отображение статистики
    function renderPurchaseStats(stats) {
        const container = document.getElementById('stats-container');
        container.innerHTML = `
        <div class="card card-stats">
            <div class="stat-value">${stats.totalPurchases || 0}</div>
            <div class="stat-label">Всего покупок</div>
        </div>
        <div class="card card-stats">
            <div class="stat-value">${stats.totalRevenue || 0} ₽</div>
            <div class="stat-label">Общий доход</div>
        </div>
        <div class="card card-stats">
            <div class="stat-value">${stats.avgPurchase || 0} ₽</div>
            <div class="stat-label">Средний чек</div>
        </div>
        <div class="card card-stats">
            <div class="stat-value">${stats.topBook?.title || 'Нет данных'}</div>
            <div class="stat-label">Самая популярная книга</div>
        </div>
        `;
    }

    // Отображение таблицы покупок
    function renderPurchases(purchases) {
        const tbody = document.getElementById('purchases-table-body');
        const table = document.getElementById("stats-table");
        const noDataMessage = document.getElementById(`no-stats`);

        if (!purchases || purchases.length === 0) {
            table.style.display = 'none';
            noDataMessage.style.display = 'block';
            return;
        }
        tbody.innerHTML = purchases.map(purchase => `
        <tr>
            <td>${purchase.id}</td>
            <td>${purchase.Book.title}</td>
            <td>${purchase.User.email}</td>
            <td>${purchase.amount} ₽</td>
            <td>${new Date(purchase.date).toLocaleDateString()}</td>
            <td>
                <span class="status-badge ${purchase.status.toLowerCase()}">
                    ${getTransStatus(purchase.status)}
                </span>
            </td>
        </tr>`).join('');

        table.style.display = 'block';
        noDataMessage.style.display = 'none';
    }

    function getTransStatus(status) {
        switch (status) {
            case 'COMPLETED':
                return 'Завершено';
            case 'FAILED':
                return 'Отклонено';
            case 'PENDING':
                return 'В процессе';
        }
    }

    const addRoleModal = setupModal('add-role-modal', '.close');
    const deleteRoleModal = setupModal('delete-role-modal', '.close');
    const addUserRoleModal = setupModal('add-user-role-modal', '.close');
    const deleteUserRoleModal = setupModal('delete-user-role-modal', '.close');

    // Открытие модального окна добавления роли пользователю
    async function openAddUserRoleModal(userId) {
        document.getElementById('target-user-id').value = userId;
        const select = document.getElementById('user-role-select');

        try {
            // Получаем роли пользователя
            const userRolesResponse = await fetch(`/api/admin/getUserRoles?userId=${userId}`);
            const userRoles = await userRolesResponse.json();

            // Получаем все роли
            const allRolesResponse = await fetch('/api/admin/getRoles');
            const allRoles = await allRolesResponse.json();

            // Фильтруем роли, оставляем только те, которых нет у пользователя
            const availableRoles = allRoles.filter(role =>
                !userRoles.some(userRole => userRole.id === role.id)
            );

            select.innerHTML = availableRoles.map(role =>
                `<option value="${role.id}">${role.name}</option>`
            ).join('');

            addUserRoleModal.style.display = 'block';
        } catch (error) {
            console.error('Error loading roles:', error);
            alert('Произошла ошибка при загрузке ролей');
        }
    }

    // Открытие модального окна удаления роли пользователя
    async function openDeleteUserRoleModal(userId) {
        document.getElementById('delete-target-user-id').value = userId;
        const select = document.getElementById('delete-user-role-select');

        // Получаем роли пользователя
        try {
            const response = await fetch(`/api/admin/getUserRoles?userId=${userId}`);
            if (response.ok) {
                const userRoles = await response.json();
                select.innerHTML = userRoles.map(role =>
                    `<option value="${role.id}">${role.name}</option>`
                ).join('');
                deleteUserRoleModal.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading user roles:', error);
        }
    }

    // Обработка формы добавления роли
    document.getElementById('add-role-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const roleData = {
            name: document.getElementById('role-name').value,
            description: document.getElementById('role-description').value
        };

        try {
            const response = await fetch('/api/admin/addRole', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(roleData)
            });

            if (response.ok) {
                alert('Роль успешно добавлена');
                addRoleModal.style.display = 'none';
                await loadRoles();
            } else {
                const error = await response.json();
                alert(error.message || 'Ошибка добавления роли');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Произошла ошибка при добавлении роли');
        }
    });

    // Обработка формы удаления роли
    document.getElementById('delete-role-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const roleName = document.querySelector('.dropdown-selector-input')?.value;

        if (!roleName) {
            alert("Пожалуйста, выберите имя роли");
            return;
        }

        try {
            const response = await fetch('/api/admin/deleteRole', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: roleName })
            });

            if (response.ok) {
                alert(`Роль "${roleName}" успешно удалена`);
                //Генерируем ивент для дропдауна, чтоб он очистился
                const dropdown = document.querySelector('#dropdown-selector-delete-role-select');
                const clearEvent = new Event('clearDropdown');
                dropdown.dispatchEvent(clearEvent);
                deleteRoleModal.style.display = 'none';
                await loadRoles();
            } else {
                const error = await response.json();
                alert(error.message || 'Ошибка удаления роли');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Произошла ошибка при удалении роли');
        }
    });

    // Обработка формы добавления роли пользователю
    document.getElementById('add-user-role-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const userId = document.getElementById('target-user-id').value;
        const roleId = document.getElementById('user-role-select').value;

        try {
            const response = await fetch('/api/admin/addUserRole', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, roleId })
            });

            if (response.ok) {
                alert('Роль пользователю успешно добавлена');
                addUserRoleModal.style.display = 'none';
                await loadUsers();
            } else {
                const error = await response.json();
                alert(error.message || 'Ошибка добавления роли пользователю');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Произошла ошибка при добавлении роли пользователю');
        }
    });

    // Обработка формы удаления роли пользователя
    document.getElementById('delete-user-role-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const userId = document.getElementById('delete-target-user-id').value;
        const roleId = document.getElementById('delete-user-role-select').value;

        try {
            const response = await fetch('/api/admin/removeUserRole', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, roleId })
            });

            if (response.ok) {
                alert('Роль пользователя успешно удалена');
                deleteUserRoleModal.style.display = 'none';
                await loadUsers();
            } else {
                const error = await response.json();
                alert(error.message || 'Ошибка удаления роли пользователя');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Произошла ошибка при удалении роли пользователя');
        }
    });

    // Обработка кнопки поиска
    document.getElementById('search-button').addEventListener('click', () => {
        const search = document.getElementById('user-search').value;
        loadUsers(search);
    });

    // Обработка кнопок для супер-админа
    document.getElementById('add-role-btn').addEventListener('click', () => {
        addRoleModal.style.display = 'block';
    });

    document.getElementById('delete-role-btn').addEventListener('click', () => {
        // Очищаем поля при открытии модального окна
        deleteRoleModal.style.display = 'block';
    });

    document.getElementById('reset-filter')?.addEventListener('click', () => {
        document.getElementById('start-date').value = '';
        document.getElementById('end-date').value = '';
    });

    document.getElementById('search-button-stats').addEventListener('click', () => {
        loadStats();
    });

    // Инициализация
    await loadRoles();
    await loadUsers();
    await loadStats();
});