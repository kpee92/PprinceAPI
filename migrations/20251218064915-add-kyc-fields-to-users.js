"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Users", "kycStatus", {
      type: Sequelize.ENUM(
        "NOT_STARTED",
        "PENDING",
        "APPROVED",
        "REJECTED"
      ),
      allowNull: false,
      defaultValue: "NOT_STARTED",
    });

    await queryInterface.addColumn("Users", "kycLevel", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Users", "kycStatus");
    await queryInterface.removeColumn("Users", "kycLevel");

    // ENUM clean up (IMPORTANT for MySQL)
    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS enum_Users_kycStatus;"
    );
  },
};
