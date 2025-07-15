-- Создаем роль супер-администратора
INSERT INTO roles (name, description)
VALUES ('super_admin', 'Полный доступ ко всем функциям системы'),
('admin', 'Может назначать модераторов, смотреть аналитику');

-- Назначение роли существующему пользователю (замените 1 на ID нужного пользователя)
INSERT INTO user_roles (userId, roleId, createdAt)
VALUES (1, (SELECT id FROM roles WHERE name = 'super_admin'), NOW());