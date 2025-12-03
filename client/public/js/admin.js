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
            else{
                document.getElementById('roles-table-actions').style.display = 'none';
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
                renderRolesTable(allRoles);
            }
        } catch (error) {
            console.error('Error loading roles: ', error);
            showNoRolesMessage();
        }
    }

    function renderRolesTable(roles) {
        const tbody = document.getElementById('roles-table-body');
        const noRolesMessage = document.getElementById('no-roles');
        
        if (!roles || roles.length === 0) {
            tbody.innerHTML = '';
            noRolesMessage.style.display = 'block';
            return;
        }
    
        noRolesMessage.style.display = 'none';
        
        tbody.innerHTML = roles.map(role => `
            <tr>
                <td>${role.id}</td>
                <td><strong>${role.name}</strong></td>
                <td>${role.description || '—'}</td>
                <td>${role.userCount || 0}</td>
                <td>${new Date(role.createdAt).toLocaleDateString()}</td>
                <td>
                    ${currentUser && currentUser.roles.some(r => r === 'super_admin') ? `
                        <button class="btn warning edit-role-btn" data-role-id="${role.id}" data-role-name="${role.name}" data-role-description="${role.description || ''}">
                            <i class="fas fa-edit"></i> Редактировать
                        </button>
                        <button class="btn danger small delete-role-btn" data-role-id="${role.id}" data-role-name="${role.name}">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    
        // Добавляем обработчики для кнопок
        document.querySelectorAll('.edit-role-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const roleId = e.currentTarget.dataset.roleId;
                const roleName = e.currentTarget.dataset.roleName;
                const roleDescription = e.currentTarget.dataset.roleDescription;
                openEditRoleModal(roleId, roleName, roleDescription);
            });
        });

        document.querySelectorAll('.delete-role-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const roleName = e.currentTarget.dataset.roleName;
                await confirmAndDeleteRole(roleName);
            });
        });
    }

    async function confirmAndDeleteRole(roleName) {
        if (!roleName) {
            alert("Пожалуйста, выберите имя роли");
            return;
        }

        if (!confirm('Вы уверены, что хотите удалить роль?')) return;
        
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
                await loadRoles();
            } else {
                const error = await response.json();
                alert(error.message || 'Ошибка удаления роли');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Произошла ошибка при удалении роли');
        }
    }

    function showNoRolesMessage() {
        const tbody = document.getElementById('roles-table-body');
        const noRolesMessage = document.getElementById('no-roles');
        tbody.innerHTML = '';
        noRolesMessage.style.display = 'block';
    }

    function openEditRoleModal(roleId, roleName, roleDescription) {
        document.getElementById('edit-role-id').value = roleId;
        document.getElementById('edit-role-name').value = roleName;
        document.getElementById('edit-role-description').value = roleDescription;
        editRoleModal.style.display = 'block';
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
        <tr data-purchaseid="${purchase.id}" data-originalstatus="${purchase.status}">
            <td>${purchase.id}</td>
            <td>${purchase.Book.title}</td>
            <td>${purchase.User.email}</td>
            <td>${purchase.amount} ₽</td>
            <td>${new Date(purchase.date).toLocaleDateString()}</td>
            <td>
                <div class="status-display">
                    <span class="status-badge ${purchase.status.toLowerCase()}">
                        ${getTransStatus(purchase.status)}
                    </span>
                 </div>
                <div class="status-edit-container" style="display: none;">
                    <select class="status-select">
                        <option value="PENDING" ${purchase.status === 'PENDING' ? 'selected' : ''}>В процессе</option>
                        <option value="COMPLETED" ${purchase.status === 'COMPLETED' ? 'selected' : ''}>Завершено</option>
                        <option value="FAILED" ${purchase.status === 'FAILED' ? 'selected' : ''}>Отклонено</option>
                    </select>
                </div>
            </td>
            <td>
                <!-- Кнопки действий -->
                <div class="action-buttons">
                    <button class="btn warning edit-status-btn" title="Изменить статус">
                        <i class="fas fa-edit"></i>
                    </button>
                    <div class="save-cancel-buttons" style="display: none;">
                        <button class="btn primary save-status-btn" title="Сохранить изменения">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn outline cancel-status-btn" title="Отменить">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </td>
        </tr>`).join('');

        table.style.display = 'block';
        noDataMessage.style.display = 'none';

        setupStatusEditHandlers();
    }

    function setupStatusEditHandlers() {
        const tableBody = document.getElementById('purchases-table-body');
        
        // Обработчик кнопки редактирования
        tableBody.querySelectorAll('.edit-status-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                enterEditMode(row);
            });
        });

        // Обработчик кнопки сохранения
        tableBody.querySelectorAll('.save-status-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const row = e.target.closest('tr');
                await saveStatusChange(row);
            });
        });

        // Обработчик кнопки отмены
        tableBody.querySelectorAll('.cancel-status-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                exitEditMode(row, true);
            });
        });
    
        // Отмена при нажатии Esc
        tableBody.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const editingRow = tableBody.querySelector('.editing-status');
                if (editingRow) {
                    exitEditMode(editingRow, true);
                }
            }
        });
    }

    // Вход в режим редактирования
    function enterEditMode(row) {
        // Выходим из режима редактирования в других строках
        document.querySelectorAll('.editing-status').forEach(r => {
            if (r !== row) exitEditMode(r, true);
        });

        // Добавляем класс для стилизации
        row.classList.add('editing-status');

        // Показываем/скрываем элементы
        row.querySelector('.status-display').style.display = 'none';
        row.querySelector('.status-edit-container').style.display = 'block';
        row.querySelector('.edit-status-btn').style.display = 'none';
        row.querySelector('.save-cancel-buttons').style.display = 'block';
    }

    // Выход из режима редактирования
    function exitEditMode(row, reset = false) {
        row.classList.remove('editing-status');

        // Показываем/скрываем элементы
        row.querySelector('.status-display').style.display = 'block';
        row.querySelector('.status-edit-container').style.display = 'none';
        row.querySelector('.edit-status-btn').style.display = 'block';
        row.querySelector('.save-cancel-buttons').style.display = 'none';

        // Сбрасываем значение, если нужно
        if (reset) {
            const originalStatus = row.dataset.originalstatus;
            const select = row.querySelector('.status-select');
            select.value = originalStatus;
        }
    }

    // Сохранение изменения статуса
    async function saveStatusChange(row) {
        const purchaseId = row.dataset.purchaseid;
        const select = row.querySelector('.status-select');
        const newStatus = select.value;
        const originalStatus = row.dataset.originalstatus;

        if (newStatus === originalStatus) {
            exitEditMode(row);
            return;
        }

        try {
            const response = await fetch('/api/admin/updatePurchaseStatus', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    purchaseId,
                    status: newStatus
                })
            });

            if (response.ok) {
                // Обновляем отображение
                const statusBadge = row.querySelector('.status-badge');
                const statusText = row.querySelector('.status-badge');

                // Обновляем классы и текст
                statusBadge.className = `status-badge ${newStatus.toLowerCase()}`;
                statusText.textContent = getTransStatus(newStatus);

                // Обновляем оригинальный статус
                row.dataset.originalStatus = newStatus;

                // Выходим из режима редактирования
                exitEditMode(row);

                // Показываем уведомление
                alert(`Статус покупки #${purchaseId} изменен с "${getTransStatus(originalStatus)}" на "${getTransStatus(newStatus)}"`);

            } else {
                const error = await response.json();
                alert(error.message || 'Ошибка обновления статуса');
                exitEditMode(row, true); // Сбрасываем к исходному
            }
        } catch (error) {
            console.error('Error updating status: ', error);
            alert('Произошла ошибка при обновлении статуса');
            exitEditMode(row, true);
        }
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

    async function loadUserTables() {
        await loadRoles();
        await loadUsers(); 
    }

    const addRoleModal = setupModal('add-role-modal', '.close');
    const addUserRoleModal = setupModal('add-user-role-modal', '.close');
    const deleteUserRoleModal = setupModal('delete-user-role-modal', '.close');
    const editRoleModal = setupModal('edit-role-modal', '.close-edit-modal');

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
                await loadUserTables();
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
                await loadUserTables();
            } else {
                const error = await response.json();
                alert(error.message || 'Ошибка удаления роли пользователя');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Произошла ошибка при удалении роли пользователя');
        }
    });

    // Обработка формы редактирования роли
    document.getElementById('edit-role-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const roleData = {
            id: document.getElementById('edit-role-id').value,
            name: document.getElementById('edit-role-name').value,
            description: document.getElementById('edit-role-description').value
        };

        if(!roleData?.name){
            alert("Пожалуйста, заполните имя роли");
            return;
        }

        try {
            const response = await fetch('/api/admin/updateRole', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(roleData)
            });

            if (response.ok) {
                alert('Роль успешно обновлена');
                editRoleModal.style.display = 'none';
                await loadUserTables();
            } else {
                const error = await response.json();
                alert(error.message || 'Ошибка обновления роли');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Произошла ошибка при обновлении роли');
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

    document.getElementById('reset-filter')?.addEventListener('click', () => {
        document.getElementById('start-date').value = '';
        document.getElementById('end-date').value = '';
    });

    document.getElementById('search-button-stats').addEventListener('click', () => {
        loadStats();
    });

    // Инициализация
    await loadUserTables();
    await loadStats();
});