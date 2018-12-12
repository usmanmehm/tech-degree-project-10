'use strict';
module.exports = (sequelize, DataTypes) => {
  const Books = sequelize.define('Books', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoincrement: true,
      validate: {
        allowNull: false
      }
    },
    title: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "Please enter a title"
        }
      }
    },
    author: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "Please enter the author's name"
        }
      }
    },
    genre: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "Please enter the book's genre"
        }
      }
    },
    first_published: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "Please specify the year that the book was published"
        }
      }
    }
  }, {});
  Books.associate = function(models) {
    // associations can be defined here
  };
  return Books;
};