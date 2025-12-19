'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Payments', 'cryptoAmount', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Payments', 'cryptoCurrency', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Payments', 'walletAddress', {
      type: Sequelize.STRING,
      allowNull: true,
    });
     
    await queryInterface.addColumn('Payments', 'fromWalletAddress', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Payments', 'network', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Payments', 'transferStatus', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'pending',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Payments', 'cryptoAmount');
    await queryInterface.removeColumn('Payments', 'cryptoCurrency');
    await queryInterface.removeColumn('Payments', 'walletAddress');
    await queryInterface.removeColumn('Payments', 'fromWalletAddress');
    await queryInterface.removeColumn('Payments', 'transferStatus');
  }
};
