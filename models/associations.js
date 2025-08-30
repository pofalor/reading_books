module.exports = function(models) {
  const { User, Role, UserRole, Book, Author, Genre, BookGenre, UserBook, Transaction, ActionHistory } = models;

  // Связи между моделями
  User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId' });
  Role.belongsToMany(User, { through: UserRole, foreignKey: 'roleId' });
  
  Author.hasMany(Book, { foreignKey: 'authorId' });
  Book.belongsTo(Author, { foreignKey: 'authorId' });
  
  Book.belongsToMany(Genre, { through: BookGenre, foreignKey: 'bookId' });
  Genre.belongsToMany(Book, { through: BookGenre, foreignKey: 'genreId' });
  
  User.belongsToMany(Book, { through: UserBook, foreignKey: 'userId' });
  Book.belongsToMany(User, { through: UserBook, foreignKey: 'bookId' });

  UserBook.belongsTo(User, { foreignKey: 'userId' });
  UserBook.belongsTo(Book, { foreignKey: 'bookId' });
  
  User.hasMany(UserBook, { foreignKey: 'userId' });
  Book.hasMany(UserBook, { foreignKey: 'bookId' });
  
  User.hasMany(Transaction, { foreignKey: 'userId' });
  Transaction.belongsTo(User, { foreignKey: 'userId' });
  
  Book.hasMany(Transaction, { foreignKey: 'bookId' });
  Transaction.belongsTo(Book, { foreignKey: 'bookId' });
  
  User.hasMany(ActionHistory, { foreignKey: 'userId', as: 'User' });
  ActionHistory.belongsTo(User, { foreignKey: 'userId', as: 'User' });
  
  Author.hasMany(ActionHistory, { foreignKey: 'authorId' });
  ActionHistory.belongsTo(Author, { foreignKey: 'authorId' });
  
  Book.hasMany(ActionHistory, { foreignKey: 'bookId' });
  ActionHistory.belongsTo(Book, { foreignKey: 'bookId' });

  Genre.hasMany(ActionHistory, { foreignKey: 'genreId' });
  ActionHistory.belongsTo(Genre, { foreignKey: 'genreId' });

  User.hasMany(Book, { foreignKey: 'creatorId' });
  Book.belongsTo(User, { foreignKey: 'creatorId' });
  
  User.hasMany(Author, { foreignKey: 'creatorId' });
  Author.belongsTo(User, { foreignKey: 'creatorId' });

  User.hasMany(ActionHistory, { foreignKey: 'actorId', as: 'Actor' });
  ActionHistory.belongsTo(User, { foreignKey: 'actorId', as: 'Actor' });
};