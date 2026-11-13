const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * addColumn(coverPath) => "books"
 *
 * Миграция идемпотентна: на базе, созданной через sequelize.sync() уже
 * с новой моделью, колонка есть, и повторно она не добавляется.
 */

const info = {
  revision: 9,
  name: "AddCoverPathToBooks",
  created: "2026-11-13T12:00:00.000Z",
  comment: "Обложки книг",
};

const hasCoverPath = async (queryInterface) => {
  const columns = await queryInterface.describeTable("books");
  return Boolean(columns.coverPath);
};

module.exports = {
  info,
  up: async (queryInterface) => {
    if (await hasCoverPath(queryInterface)) return;

    await queryInterface.addColumn("books", "coverPath", {
      type: Sequelize.STRING,
      field: "coverPath",
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    if (!(await hasCoverPath(queryInterface))) return;

    await queryInterface.removeColumn("books", "coverPath");
  },
};
