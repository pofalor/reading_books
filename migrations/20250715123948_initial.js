const Sequelize = require("sequelize");

/**
 * Actions summary:
 *
 * createTable() => "users", deps: []
 * createTable() => "roles", deps: []
 * createTable() => "authors", deps: []
 * createTable() => "genres", deps: []
 * createTable() => "user_roles", deps: [users, roles]
 * createTable() => "books", deps: [authors]
 * createTable() => "book_genres", deps: [books, genres]
 * createTable() => "user_books", deps: [users, books]
 * createTable() => "transactions", deps: [users, books]
 * createTable() => "action_history", deps: [users, users, authors, books]
 *
 */

const info = {
  revision: 1,
  name: "initial",
  created: "2025-07-15T12:39:48.083Z",
  comment: "",
};

const migrationCommands = (transaction) => [
  {
    fn: "createTable",
    params: [
      "users",
      {
        id: {
          type: Sequelize.INTEGER,
          field: "id",
          autoIncrement: true,
          primaryKey: true,
        },
        firstName: {
          type: Sequelize.STRING,
          field: "firstName",
          allowNull: false,
        },
        lastName: {
          type: Sequelize.STRING,
          field: "lastName",
          allowNull: false,
        },
        email: {
          type: Sequelize.STRING,
          field: "email",
          unique: true,
          allowNull: false,
        },
        passwordHash: {
          type: Sequelize.STRING,
          field: "passwordHash",
          allowNull: false,
        },
        createdAt: {
          type: Sequelize.DATE,
          field: "createdAt",
          defaultValue: Sequelize.NOW,
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          field: "updatedAt",
          defaultValue: Sequelize.NOW,
          allowNull: false,
        },
      },
      { transaction },
    ],
  },
  {
    fn: "createTable",
    params: [
      "roles",
      {
        id: {
          type: Sequelize.INTEGER,
          field: "id",
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: Sequelize.STRING,
          field: "name",
          unique: true,
          allowNull: false,
        },
        description: { type: Sequelize.STRING, field: "description" },
      },
      { transaction },
    ],
  },
  {
    fn: "createTable",
    params: [
      "authors",
      {
        id: {
          type: Sequelize.INTEGER,
          field: "id",
          autoIncrement: true,
          primaryKey: true,
        },
        firstName: {
          type: Sequelize.STRING,
          field: "firstName",
          allowNull: false,
        },
        secondName: { type: Sequelize.STRING, field: "secondName" },
        surname: { type: Sequelize.STRING, field: "surname" },
        nickName: { type: Sequelize.STRING, field: "nickName" },
        birthDate: { type: Sequelize.DATEONLY, field: "birthDate" },
        createdAt: {
          type: Sequelize.DATE,
          field: "createdAt",
          defaultValue: Sequelize.NOW,
          allowNull: false,
        },
      },
      { transaction },
    ],
  },
  {
    fn: "createTable",
    params: [
      "genres",
      {
        id: {
          type: Sequelize.INTEGER,
          field: "id",
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: Sequelize.STRING,
          field: "name",
          unique: true,
          allowNull: false,
        },
        description: { type: Sequelize.TEXT, field: "description" },
      },
      { transaction },
    ],
  },
  {
    fn: "createTable",
    params: [
      "user_roles",
      {
        userId: {
          type: Sequelize.INTEGER,
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          unique: "user_roles_roleId_userId_unique",
          field: "userId",
          references: { model: "users", key: "id" },
          primaryKey: true,
        },
        roleId: {
          type: Sequelize.INTEGER,
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          unique: "user_roles_roleId_userId_unique",
          field: "roleId",
          references: { model: "roles", key: "id" },
          primaryKey: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          field: "createdAt",
          defaultValue: Sequelize.NOW,
          allowNull: false,
        },
      },
      { transaction },
    ],
  },
  {
    fn: "createTable",
    params: [
      "books",
      {
        id: {
          type: Sequelize.INTEGER,
          field: "id",
          autoIncrement: true,
          primaryKey: true,
        },
        title: { type: Sequelize.STRING, field: "title", allowNull: false },
        isConfirmed: {
          type: Sequelize.BOOLEAN,
          field: "isConfirmed",
          defaultValue: false,
        },
        publicationDate: { type: Sequelize.DATEONLY, field: "publicationDate" },
        description: { type: Sequelize.TEXT, field: "description" },
        pagesCount: {
          type: Sequelize.INTEGER,
          field: "pagesCount",
          allowNull: false,
        },
        authorId: {
          type: Sequelize.INTEGER,
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          allowNull: true,
          field: "authorId",
          references: { model: "authors", key: "id" },
        },
        createdAt: {
          type: Sequelize.DATE,
          field: "createdAt",
          defaultValue: Sequelize.NOW,
          allowNull: false,
        },
      },
      { transaction },
    ],
  },
  {
    fn: "createTable",
    params: [
      "book_genres",
      {
        bookId: {
          type: Sequelize.INTEGER,
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          unique: "book_genres_genreId_bookId_unique",
          field: "bookId",
          references: { model: "books", key: "id" },
          primaryKey: true,
        },
        genreId: {
          type: Sequelize.INTEGER,
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          unique: "book_genres_genreId_bookId_unique",
          field: "genreId",
          references: { model: "genres", key: "id" },
          primaryKey: true,
        },
      },
      { transaction },
    ],
  },
  {
    fn: "createTable",
    params: [
      "user_books",
      {
        userId: {
          type: Sequelize.INTEGER,
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          unique: "user_books_bookId_userId_unique",
          field: "userId",
          references: { model: "users", key: "id" },
          primaryKey: true,
        },
        bookId: {
          type: Sequelize.INTEGER,
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          unique: "user_books_bookId_userId_unique",
          field: "bookId",
          references: { model: "books", key: "id" },
          primaryKey: true,
        },
        status: {
          type: Sequelize.ENUM("OnShelf", "InProgress", "Deleted"),
          field: "status",
          defaultValue: "OnShelf",
        },
        addedAt: {
          type: Sequelize.DATE,
          field: "addedAt",
          defaultValue: Sequelize.NOW,
          allowNull: false,
        },
        lastUpdated: {
          type: Sequelize.DATE,
          field: "lastUpdated",
          defaultValue: Sequelize.NOW,
          allowNull: false,
        },
        lastPage: {
          type: Sequelize.INTEGER,
          field: "lastPage",
          defaultValue: 0,
        },
      },
      { transaction },
    ],
  },
  {
    fn: "createTable",
    params: [
      "transactions",
      {
        id: {
          type: Sequelize.INTEGER,
          field: "id",
          autoIncrement: true,
          primaryKey: true,
        },
        userId: {
          type: Sequelize.INTEGER,
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          allowNull: true,
          field: "userId",
          references: { model: "users", key: "id" },
        },
        bookId: {
          type: Sequelize.INTEGER,
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
          allowNull: true,
          field: "bookId",
          references: { model: "books", key: "id" },
        },
        type: {
          type: Sequelize.ENUM("PURCHASE"),
          field: "type",
          defaultValue: "PURCHASE",
        },
        amount: { type: Sequelize.FLOAT, field: "amount", allowNull: false },
        date: {
          type: Sequelize.DATE,
          field: "date",
          defaultValue: Sequelize.NOW,
          allowNull: false,
        },
        status: {
          type: Sequelize.ENUM("COMPLETED", "FAILED", "PENDING"),
          field: "status",
          defaultValue: "PENDING",
        },
      },
      { transaction },
    ],
  },
  {
    fn: "createTable",
    params: [
      "action_history",
      {
        id: {
          type: Sequelize.INTEGER,
          field: "id",
          autoIncrement: true,
          primaryKey: true,
        },
        actionType: {
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
        description: {
          type: Sequelize.TEXT,
          field: "description",
          allowNull: false,
        },
        timestamp: {
          type: Sequelize.DATE,
          field: "timestamp",
          defaultValue: Sequelize.NOW,
          allowNull: false,
        },
        actorId: {
          type: Sequelize.INTEGER,
          field: "actorId",
          allowNull: false,
          references: { model: "users", key: "id" },
        },
        userId: {
          type: Sequelize.INTEGER,
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
          field: "userId",
          allowNull: true,
          references: { model: "users", key: "id" },
        },
        authorId: {
          type: Sequelize.INTEGER,
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
          field: "authorId",
          allowNull: true,
          references: { model: "authors", key: "id" },
        },
        bookId: {
          type: Sequelize.INTEGER,
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
          field: "bookId",
          allowNull: true,
          references: { model: "books", key: "id" },
        },
      },
      { transaction },
    ],
  },
];

const rollbackCommands = (transaction) => [
  {
    fn: "dropTable",
    params: ["users", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["roles", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["user_roles", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["authors", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["books", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["genres", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["book_genres", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["user_books", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["transactions", { transaction }],
  },
  {
    fn: "dropTable",
    params: ["action_history", { transaction }],
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
