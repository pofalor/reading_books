const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * addColumn(updatedAt) => "roles"
 * addColumn(createdAt) => "roles"
 * addColumn(updatedAt) => "transactions"
 * addColumn(createdAt) => "transactions"
 *
 */

const info = {
  revision: 7,
  name: "RoleTimestamps",
  created: "2025-12-02T23:31:21.321Z",
  comment: "",
};

const migrationCommands = (transaction) => [
  {
    fn: "addColumn",
    params: [
      "roles",
      "updatedAt",
      { type: Sequelize.DATE, field: "updatedAt", allowNull: false },
      { transaction },
    ],
  },
  {
    fn: "addColumn",
    params: [
      "roles",
      "createdAt",
      { type: Sequelize.DATE, field: "createdAt", allowNull: false },
      { transaction },
    ],
  },
  {
    fn: "addColumn",
    params: [
      "transactions",
      "updatedAt",
      { type: Sequelize.DATE, field: "updatedAt", allowNull: false },
      { transaction },
    ],
  },
  {
    fn: "addColumn",
    params: [
      "transactions",
      "createdAt",
      { type: Sequelize.DATE, field: "createdAt", allowNull: false },
      { transaction },
    ],
  },
];

const rollbackCommands = (transaction) => [
  {
    fn: "removeColumn",
    params: ["roles", "updatedAt", { transaction }],
  },
  {
    fn: "removeColumn",
    params: ["roles", "createdAt", { transaction }],
  },
  {
    fn: "removeColumn",
    params: ["transactions", "updatedAt", { transaction }],
  },
  {
    fn: "removeColumn",
    params: ["transactions", "createdAt", { transaction }],
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
