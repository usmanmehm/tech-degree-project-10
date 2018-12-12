'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'Books',
        'createdAt',
         Sequelize.DATE
       ),
      queryInterface.addColumn(
        'Books',
        'updatedAt',
        Sequelize.DATE
      )
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Books', 'createdAt'),
      queryInterface.removeColumn('Books', 'updatedAt')
    ]);
  }
};
