// Применяет (или откатывает) одну миграцию из migrations/ через подключение
// самого приложения.
//
// Нужен для Docker: в образе нет sequelize-cli (это devDependency), а база
// там создаётся через sequelize.sync(), без таблицы SequelizeMeta, так что
// `sequelize db:migrate` попытался бы прогнать все миграции с самой первой.
//
//   docker compose exec app node scripts/run-migration.js 20261113120000_AddCoverPathToBooks
//   docker compose exec app node scripts/run-migration.js 20261113120000_AddCoverPathToBooks down

const path = require('path');
const Sequelize = require('sequelize');
const { sequelize } = require('../models');

async function main() {
    const [name, direction = 'up'] = process.argv.slice(2);

    if (!name || !['up', 'down'].includes(direction)) {
        throw new Error('Использование: node scripts/run-migration.js <имя миграции> [up|down]');
    }

    const migration = require(path.join(__dirname, '..', 'migrations', path.basename(name, '.js')));
    await migration[direction](sequelize.getQueryInterface(), Sequelize);
    console.log(`Миграция ${name}: ${direction} выполнена`);
}

main()
    .catch((err) => {
        console.error(err.message);
        process.exitCode = 1;
    })
    .finally(() => sequelize.close());
