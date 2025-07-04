document.addEventListener('DOMContentLoaded', async () => {
    // Загрузка списка администраторов
    async function loadAdmins() {
        try {
            const response = await fetch('/api/admin/admins');
            
            if (!response.ok) throw new Error('Ошибка загрузки');
            
            const admins = await response.json();
            renderAdmins(admins);
        } catch (error) {
            alert(error.message);
        }
    }
    
    // Рендер списка
    function renderAdmins(admins) {
        const tbody = document.getElementById('admins-table-body');
        tbody.innerHTML = admins.map(admin => `
            <tr>
                <td>${admin.id}</td>
                <td>${admin.firstName} ${admin.lastName}</td>
                <td>${admin.email}</td>
                <td>${new Date(admin.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn small danger" data-id="${admin.id}">Удалить</button>
                </td>
            </tr>
        `).join('');
    }
    
    // Управление модальным окном
    const modal = document.getElementById('add-admin-modal');
    document.getElementById('add-admin-btn').addEventListener('click', () => {
        modal.style.display = 'block';
    });
    
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
            const response = await fetch('/api/admin/admins', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(adminData)
            });
            
            if (!response.ok) throw new Error('Ошибка создания');
            
            Toast.success('Администратор успешно добавлен');
            modal.style.display = 'none';
            loadAdmins();
        } catch (error) {
            Toast.error(error.message);
        }
    });
    
    // Инициализация
    loadAdmins();
});

function generateTempPassword() {
    return Math.random().toString(36).slice(-8);
}