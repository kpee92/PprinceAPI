'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('Users');

    if (!table.walletAddress) {
      await queryInterface.addColumn('Users', 'walletAddress', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!table.walletNetwork) {
      await queryInterface.addColumn('Users', 'walletNetwork', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('Users');

    if (table.walletAddress) {
      await queryInterface.removeColumn('Users', 'walletAddress');
    }
    if (table.walletNetwork) {
      await queryInterface.removeColumn('Users', 'walletNetwork');
    }
  }
};
