"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Payments", "referenceId", {
      type: Sequelize.STRING,
      allowNull: true,
      after: "paymentId",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Payments", "referenceId");
  },
};

