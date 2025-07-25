const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * removeColumn(publicationDate) => "books"
 * addColumn(publicationYear) => "books"
 * addColumn(publicationMonth) => "books"
 * addColumn(publicationDay) => "books"
 *
 */

const info = {
  revision: 7,
  name: "editPubDate",
  created: "2025-07-25T09:56:20.953Z",
  comment: "",
};

const migrationCommands = (transaction) => [
  {
    fn: "removeColumn",
    params: ["books", "publicationDate", { transaction }],
  },
  {
    fn: "addColumn",
    params: [
      "books",
      "publicationYear",
      { type: Sequelize.INTEGER, field: "publicationYear", allowNull: true },
      { transaction },
    ],
  },
  {
    fn: "addColumn",
    params: [
      "books",
      "publicationMonth",
      { type: Sequelize.INTEGER, field: "publicationMonth", allowNull: true },
      { transaction },
    ],
  },
  {
    fn: "addColumn",
    params: [
      "books",
      "publicationDay",
      { type: Sequelize.INTEGER, field: "publicationDay", allowNull: true },
      { transaction },
    ],
  },
];

const rollbackCommands = (transaction) => [
  {
    fn: "removeColumn",
    params: ["books", "publicationYear", { transaction }],
  },
  {
    fn: "removeColumn",
    params: ["books", "publicationMonth", { transaction }],
  },
  {
    fn: "removeColumn",
    params: ["books", "publicationDay", { transaction }],
  },
  {
    fn: "addColumn",
    params: [
      "books",
      "publicationDate",
      { type: Sequelize.DATEONLY, field: "publicationDate", allowNull: true },
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
