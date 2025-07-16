const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * addColumn(creatorId) => "authors"
 * addColumn(genreId) => "action_history"
 * changeColumn(actionType) => "action_history"
 *
 */

const info = {
  revision: 3,
  name: "quickFixes",
  created: "2025-07-16T12:04:52.556Z",
  comment: "",
};

const migrationCommands = (transaction) => [
  {
    fn: "addColumn",
    params: [
      "authors",
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
      "action_history",
      "genreId",
      {
        type: Sequelize.INTEGER,
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        field: "genreId",
        allowNull: true,
        references: { model: "genres", key: "id" },
      },
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
          "DeleteGenre"
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
    params: ["authors", "creatorId", { transaction }],
  },
  {
    fn: "removeColumn",
    params: ["action_history", "genreId", { transaction }],
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
          "RemoveRoleFromUser"
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
