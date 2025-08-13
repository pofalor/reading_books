const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * changeColumn(bookId) => "user_books"
 * changeColumn(userId) => "user_books"
 *
 */

const info = {
  revision: 11,
  name: "UserBookLink",
  created: "2025-08-13T18:42:49.938Z",
  comment: "",
};

const migrationCommands = (transaction) => [
  {
    fn: "changeColumn",
    params: [
      "user_books",
      "bookId",
      {
        type: Sequelize.INTEGER,
        allowNull: true,
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        unique: "user_books_bookId_userId_unique",
        field: "bookId",
        references: { model: "books", key: "id" },
        primaryKey: true,
      },
      { transaction },
    ],
  },
  {
    fn: "changeColumn",
    params: [
      "user_books",
      "userId",
      {
        type: Sequelize.INTEGER,
        allowNull: true,
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        unique: "user_books_bookId_userId_unique",
        field: "userId",
        references: { model: "users", key: "id" },
        primaryKey: true,
      },
      { transaction },
    ],
  },
];

const rollbackCommands = (transaction) => [
  {
    fn: "changeColumn",
    params: [
      "user_books",
      "bookId",
      {
        type: Sequelize.INTEGER,
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        unique: "user_books_bookId_userId_unique",
        field: "bookId",
        references: { model: "books", key: "id" },
        primaryKey: true,
      },
      { transaction },
    ],
  },
  {
    fn: "changeColumn",
    params: [
      "user_books",
      "userId",
      {
        type: Sequelize.INTEGER,
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        unique: "user_books_bookId_userId_unique",
        field: "userId",
        references: { model: "users", key: "id" },
        primaryKey: true,
      },
      { transaction },
    ],
  },
];

const pos = 0;
const useTransaction = true;

const execute = (queryInterface, sequelize, _commands) => {
  let index = pos;
  const run = (transaction) => {
    const commands = _commands(transaction);
    return new Promise((resolve, reject) => {
      const next = () => {
        if (index < commands.length) {
          const command = commands[index];
          console.log(`[#${index}] execute: ${command.fn}`);
          index++;
          queryInterface[command.fn](...command.params).then(next, reject);
        } else resolve();
      };
      next();
    });
  };
  if (useTransaction) return queryInterface.sequelize.transaction(run);
  return run(null);
};

module.exports = {
  pos,
  useTransaction,
  up: (queryInterface, sequelize) =>
    execute(queryInterface, sequelize, migrationCommands),
  down: (queryInterface, sequelize) =>
    execute(queryInterface, sequelize, rollbackCommands),
  info,
};
