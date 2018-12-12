'use strict';
module.exports = (sequelize, DataTypes) => {
  const Patrons = sequelize.define('Patrons', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    first_name: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "Please enter a first name"
        }
      }
    },
    last_name: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "Please enter a last name"
        }
      }
    },
    address: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "Please enter an address"
        }
      }
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: {
          msg: "Please enter a valid email"
        }
      }
    },
    library_id: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "Please enter a Library ID"
        }
      }
    },
    zip_code: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          msg: "Please enter a zip code"
        }
      }
    }
  }, {});
  Patrons.associate = function(models) {
    // associations can be defined here
  };
  return Patrons;
};