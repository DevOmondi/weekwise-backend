"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Users", "paymentID");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("Users", "paymentID", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
