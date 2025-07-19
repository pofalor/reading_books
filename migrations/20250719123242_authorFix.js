const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * addColumn(bio) => "authors"
 * changeColumn(nickName) => "authors"
 * changeColumn(firstName) => "authors"
 *
 */

const info = {
  revision: 4,
  name: "authorFix",
  created: "2025-07-19T12:32:42.312Z",
  comment: "",
};

const migrationCommands = (transaction) => [
  {
    fn: "addColumn",
    params: [
      "authors",
      "bio",
      { type: Sequelize.TEXT, field: "bio" },
      { transaction },
    ],
  },
  {
    fn: "changeColumn",
    params: [
      "authors",
      "nickName",
      {
        type: Sequelize.STRING,
        field: "nickName",
        unique: true,
        allowNull: false,
      },
      { transaction },
    ],
  },
  {
    fn: "changeColumn",
    params: [
      "authors",
      "firstName",
      { type: Sequelize.STRING, field: "firstName" },
      { transaction },
    ],
  },
];

const rollbackCommands = (transaction) => [
  {
    fn: "removeColumn",
    params: ["authors", "bio", { transaction }],
  },
  {
    fn: "changeColumn",
    params: [
      "authors",
      "nickName",
      { type: Sequelize.STRING, field: "nickName" },
      { transaction },
    ],
  },
  {
    fn: "changeColumn",
    params: [
      "authors",
      "firstName",
      { type: Sequelize.STRING, field: "firstName", allowNull: false },
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
