'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'previous_messages', {
      type: Sequelize.ARRAY(Sequelize.TEXT), // Array of strings
      allowNull: true, // Existing rows will have NULL initially
    });
    
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'previous_messages');
  }
};
