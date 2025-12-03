const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * addColumn(updatedAt) => "authors"
 * addColumn(updatedAt) => "books"
 * addColumn(createdAt) => "genres"
 * addColumn(updatedAt) => "genres"
 * changeColumn(actionType) => "action_history"
 *
 */

const info = {
  revision: 3,
  name: "AddEditToBaseEntities",
  created: "2025-11-30T12:23:16.356Z",
  comment: "",
};

const migrationCommands = (transaction) => [
  {
    fn: "addColumn",
    params: [
      "authors",
      "updatedAt",
      { type: Sequelize.DATE, field: "updatedAt", allowNull: false },
      { transaction },
    ],
  },
  {
    fn: "addColumn",
    params: [
      "books",
      "updatedAt",
      { type: Sequelize.DATE, field: "updatedAt", allowNull: false },
      { transaction },
    ],
  },
  {
    fn: "addColumn",
    params: [
      "genres",
      "createdAt",
      {
        type: Sequelize.DATE,
        field: "createdAt",
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      { transaction },
    ],
  },
  {
    fn: "addColumn",
    params: [
      "genres",
      "updatedAt",
      { type: Sequelize.DATE, field: "updatedAt", allowNull: false },
      { transaction },
    ],
  },
  {
    fn: "changeColumn",
    params: [
      "action_history",
      "actionType",
      {
        type: Sequelize.ENUM(
          "AddAuthor",
          "AddBook",
          "DeleteAuthor",
          "DeleteBook",
          "AddRole",
          "DeleteRole",
          "AddRoleToUser",
          "RemoveRoleFromUser",
          "ApproveBook",
          "ApproveAuthor",
          "AddGenre",
          "DeleteGenre",
          "AddBookGenre",
          "AddUserBook",
          "RemoveUserBook",
          "BeginReading",
          "UpdateProfile",
          "UpdateBook",
          "RemoveBookGenres",
          "UpdateAuthor",
          "UpdateGenre"
        ),
        field: "actionType",
        allowNull: false,
      },
      { transaction },
    ],
  },
];

const rollbackCommands = (transaction) => [
  {
    fn: "removeColumn",
    params: ["authors", "updatedAt", { transaction }],
  },
  {
    fn: "removeColumn",
    params: ["books", "updatedAt", { transaction }],
  },
  {
    fn: "removeColumn",
    params: ["genres", "createdAt", { transaction }],
  },
  {
    fn: "removeColumn",
    params: ["genres", "updatedAt", { transaction }],
  },
  {
    fn: "changeColumn",
    params: [
      "action_history",
      "actionType",
      {
        type: Sequelize.ENUM(
          "AddAuthor",
          "AddBook",
          "DeleteAuthor",
          "DeleteBook",
          "AddRole",
          "DeleteRole",
          "AddRoleToUser",
          "RemoveRoleFromUser",
          "ApproveBook",
          "ApproveAuthor",
          "AddGenre",
          "DeleteGenre",
          "AddBookGenre",
          "AddUserBook",
          "RemoveUserBook",
          "BeginReading",
          "UpdateProfile"
        ),
        field: "actionType",
        allowNull: false,
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
