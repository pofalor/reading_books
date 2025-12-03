const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * changeColumn(actionType) => "action_history"
 *
 */

const info = {
  revision: 8,
  name: "UpdatePurchaseStatusFeature",
  created: "2025-12-03T00:33:38.160Z",
  comment: "",
};

const migrationCommands = (transaction) => [
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
          "UpdateGenre",
          "UpdateRole",
          "UpdatePurchaseStatus"
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
          "UpdateGenre",
          "UpdateRole"
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
