document.addEventListener('DOMContentLoaded', async () => {
    let currentUser = null;
    let allRoles = [];

    // Проверяем роль текущего пользователя
    try {
        const response = await fetch('/api/auth/profile');
        if (response.ok) {
            currentUser = await response.json();
            if (currentUser && currentUser.Roles.some(r => r.name === 'super_admin')) {
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
                        <span class="role-badge">${role.name}</span>
                    `).join('') : ''}
                </td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                    ${currentUser && currentUser.Roles.some(r => r.name === 'super_admin' || r.name === 'admin') ? `
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

    // Управление модальными окнами
    function setupModal(modalId, closeSelector) {
        const modal = document.getElementById(modalId);
        const close = modal.querySelector(closeSelector);

        close.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });

        return modal;
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

    // Обработка поиска ролей при удалении
    "input focus".split(" ").forEach(function (type) {
        document.getElementById('delete-role-search').addEventListener(type, async (e) => {
            const searchTerm = e.target.value?.trim()?.toLowerCase();
            const dropdown = document.getElementById('delete-role-dropdown');

            try {
                const response = await fetch('/api/admin/getRoles');
                if (response.ok) {
                    const roles = await response.json();

                    // Фильтруем роли по поисковому запросу
                    const filteredRoles = roles.filter(role =>
                        role.name.toLowerCase().includes(searchTerm) || !searchTerm
                    );

                    if (filteredRoles.length > 0) {
                        dropdown.innerHTML = filteredRoles.map(role =>
                            `<div class="role-dropdown-item" data-id="${role.id}" data-name="${role.name}">
                        ${role.name} <small>${role.description || ''}</small>
                    </div>`
                        ).join('');
                        dropdown.style.display = 'block';
                    } else {
                        dropdown.innerHTML = '<div class="role-dropdown-item no-results">Роли не найдены</div>';
                        dropdown.style.display = 'block';
                    }
                }
            } catch (error) {
                console.error('Error searching roles:', error);
                dropdown.innerHTML = '<div class="role-dropdown-item error">Ошибка загрузки ролей</div>';
                dropdown.style.display = 'block';
            }
        })
    });

    // Обработка выбора роли из dropdown
    document.getElementById('delete-role-dropdown').addEventListener('click', (e) => {
        const item = e.target.closest('.role-dropdown-item');
        if (!item || item.classList.contains('no-results')) return;

        const roleId = item.dataset.id;
        const roleName = item.dataset.name;

        // Заполняем поле поиска выбранной ролью
        document.getElementById('delete-role-search').value = roleName;
        document.getElementById('delete-role-id').value = roleId;

        // Скрываем dropdown
        document.getElementById('delete-role-dropdown').style.display = 'none';

        // Подсвечиваем выбранный элемент
        document.querySelectorAll('.role-dropdown-item').forEach(el => {
            el.classList.remove('selected');
        });
        item.classList.add('selected');
    });

    // Закрываем dropdown при клике вне его
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-role-container')) {
            document.getElementById('delete-role-dropdown').style.display = 'none';
        }
    });

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

        const roleName = document.getElementById('delete-role-search').value;

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
                deleteRoleModal.style.display = 'none';
                // Очищаем поля после успешного удаления
                document.getElementById('delete-role-search').value = '';
                document.getElementById('delete-role-id').value = '';
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
        document.getElementById('delete-role-search').value = '';
        document.getElementById('delete-role-id').value = '';
        document.getElementById('delete-role-dropdown').style.display = 'none';
        deleteRoleModal.style.display = 'block';
    });

    // Инициализация
    await loadRoles();
    await loadUsers();
});