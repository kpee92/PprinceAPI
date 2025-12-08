"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Since altering primary key is complex, drop and recreate the table with UUID
    await queryInterface.dropTable("Users");

    await queryInterface.createTable("Users", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      emailVerify: {
        type: Sequelize.TINYINT,
        defaultValue: 0,
      },
      twoFaSecret: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      twoFaStatus: {
        type: Sequelize.TINYINT,
        defaultValue: 0,
      },
      isDelete: {
        type: Sequelize.TINYINT,
        defaultValue: 0,
      },
      otp: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop the UUID table
    await queryInterface.dropTable("Users");

    // Recreate with INTEGER id
    await queryInterface.createTable("Users", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      emailVerify: {
        type: Sequelize.TINYINT,
        defaultValue: 0,
      },
      twoFaSecret: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      twoFaStatus: {
        type: Sequelize.TINYINT,
        defaultValue: 0,
      },
      isDelete: {
        type: Sequelize.TINYINT,
        defaultValue: 0,
      },
      otp: {
        type: Sequelize.STRING,
        defaultValue: null,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
};
