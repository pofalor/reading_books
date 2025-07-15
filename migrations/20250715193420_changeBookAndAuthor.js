const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * addColumn(isConfirmed) => "authors"
 * addColumn(creatorId) => "books"
 * addColumn(guestAvailable) => "books"
 * addColumn(price) => "books"
 * addColumn(path) => "books"
 * changeColumn(authorId) => "books"
 *
 */

const info = {
  revision: 2,
  name: "changeBookAndAuthor",
  created: "2025-07-15T19:34:20.475Z",
  comment: "",
};

const migrationCommands = (transaction) => [
  {
    fn: "addColumn",
    params: [
      "authors",
      "isConfirmed",
      { type: Sequelize.BOOLEAN, field: "isConfirmed", defaultValue: false },
      { transaction },
    ],
  },
  {
    fn: "addColumn",
    params: [
      "books",
      "creatorId",
      {
        type: Sequelize.INTEGER,
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        field: "creatorId",
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      { transaction },
    ],
  },
  {
    fn: "addColumn",
    params: [
      "books",
      "guestAvailable",
      {
        type: Sequelize.BOOLEAN,
        field: "guestAvailable",
        defaultValue: true,
        allowNull: false,
      },
      { transaction },
    ],
  },
  {
    fn: "addColumn",
    params: [
      "books",
      "price",
      { type: Sequelize.FLOAT, field: "price", allowNull: true },
      { transaction },
    ],
  },
  {
    fn: "addColumn",
    params: [
      "books",
      "path",
      { type: Sequelize.STRING, field: "path", allowNull: false },
      { transaction },
    ],
  },
  {
    fn: "changeColumn",
    params: [
      "books",
      "authorId",
      {
        type: Sequelize.INTEGER,
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        field: "authorId",
        allowNull: false,
        references: { model: "authors", key: "id" },
      },
      { transaction },
    ],
  },
];

const rollbackCommands = (transaction) => [
  {
    fn: "removeColumn",
    params: ["authors", "isConfirmed", { transaction }],
  },
  {
    fn: "removeColumn",
    params: ["books", "creatorId", { transaction }],
  },
  {
    fn: "removeColumn",
    params: ["books", "guestAvailable", { transaction }],
  },
  {
    fn: "removeColumn",
    params: ["books", "price", { transaction }],
  },
  {
    fn: "removeColumn",
    params: ["books", "path", { transaction }],
  },
  {
    fn: "changeColumn",
    params: [
      "books",
      "authorId",
      {
        type: Sequelize.INTEGER,
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: true,
        field: "authorId",
        references: { model: "authors", key: "id" },
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
