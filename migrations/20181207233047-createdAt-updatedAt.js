'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'Patrons',
        'createdAt',
        {
          type: Sequelize.DATE,
          allowNull:false,
          defaultValue: new Date()
         }
       ),
      queryInterface.addColumn(
        'Patrons',
        'updatedAt',
        {
         type: Sequelize.DATE,
          allowNull:false,
          defaultValue: new Date()
        }
      ),
      queryInterface.addColumn(
        'Loans',
        'createdAt',
        {
          type: Sequelize.DATE,
           allowNull: false,
           defaultValue: new Date()
         }
       ),
      queryInterface.addColumn(
        'Loans',
        'updatedAt',
        {
          type: Sequelize.DATE,
           allowNull:false,
           defaultValue: new Date()
         }
      )
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Patrons', 'createdAt'),
      queryInterface.removeColumn('Loans', 'createdAt'),
      queryInterface.removeColumn('Patrons', 'updatedAt'),
      queryInterface.removeColumn('Loans', 'updatedAt')
    ]);
  }
};
