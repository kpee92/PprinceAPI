'use strict';

const sequelize = require('../db');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CryptoTransfers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      paymentId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'Payments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      cryptoAmount: {
        type: Sequelize.STRING,
        allowNull: true
      },
      cryptoCurrency: {
        type: Sequelize.STRING,
        allowNull: true
      },
      walletAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      fromWalletAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      network: {
        type: Sequelize.STRING,
        allowNull: true
      },
      txHash: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Blockchain transaction hash'
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Transfer status: pending, success, failed'
      },
       isProcessed: {
         type: Sequelize.BOOLEAN,
         allowNull: false,
         defaultValue: false,
         comment: 'Indicates whether crypto transfer process has been executed (true = processed, false = pending)',
       },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('CryptoTransfers');
  }
};
