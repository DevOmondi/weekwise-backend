// 'use strict';

// /** @type {import('sequelize-cli').Migration} */
// module.exports = {
//   async up (queryInterface, Sequelize) {
//     /**
//      * Add altering commands here.
//      *
//      * Example:
//      * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
//      */
//     await queryInterface.changeColumn('Users', 'scheduled_messages', {
//       type: Sequelize.ARRAY(Sequelize.JSON),
//       allowNull: true,
//     });
//   },

//   async down (queryInterface, Sequelize) {
//     /**
//      * Add reverting commands here.
//      *
//      * Example:
//      * await queryInterface.dropTable('users');
//      */
//     await queryInterface.changeColumn('Users', 'scheduled_messages', {
//       type: Sequelize.ARRAY(Sequelize.TEXT),
//       allowNull: true,
//     });
//   }
// };

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop the existing column
    await queryInterface.removeColumn('Users', 'scheduled_messages');

    // Add the column again with the desired type
    await queryInterface.addColumn('Users', 'scheduled_messages', {
      type: Sequelize.ARRAY(Sequelize.JSONB),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert to the original column definition
    await queryInterface.removeColumn('Users', 'scheduled_messages');

    // Add the column again with the original type
    await queryInterface.addColumn('Users', 'scheduled_messages', {
      type: Sequelize.ARRAY(Sequelize.TEXT),
      allowNull: true,
    });
  },
};

