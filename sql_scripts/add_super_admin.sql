-- Создаем роль супер-администратора.
-- createdAt/updatedAt заполняем явно: модель Role объявлена с timestamps,
-- и sequelize.sync() создаёт эти столбцы NOT NULL без значения по умолчанию.
INSERT INTO roles (name, description, createdAt, updatedAt)
VALUES ('super_admin', 'Полный доступ ко всем функциям системы', NOW(), NOW()),
('admin', 'Может назначать модераторов, смотреть аналитику', NOW(), NOW()),
('moderator', 'Модерация контента: добавление книг, авторов, жанров', NOW(), NOW());

-- Назначение роли существующему пользователю (замените 1 на ID нужного пользователя)
INSERT INTO user_roles (userId, roleId, createdAt)
VALUES (1, (SELECT id FROM roles WHERE name = 'super_admin'), NOW());