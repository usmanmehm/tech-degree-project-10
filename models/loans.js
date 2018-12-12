'use strict';
module.exports = (sequelize, DataTypes) => {
  const Loans = sequelize.define('Loans', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      validate: {
        allowNull: false
      }
    },
    book_id: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "Please select a book from the list"
        }
      }
    },
    patron_id: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "Please select a patron from the list"
        }
      }
    },
    loaned_on: {
      type: DataTypes.DATEONLY,
      validate: {
        isDate: {
          msg: "Please enter the date the book is being loaned"
        }
      }
    },
    return_by: {
      type: DataTypes.DATEONLY,
      validate: {
        isDate: {
          msg: "Please enter the date when the book should be returned"
        }
      }
    },
    returned_on: DataTypes.DATEONLY
  }, {});
  Loans.associate = function(models) {
    // associations can be defined here
  };
  return Loans;
};