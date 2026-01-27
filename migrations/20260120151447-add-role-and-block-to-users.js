'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('Users', 'user_role', {
            type: Sequelize.STRING,
            defaultValue: 'user',
            allowNull: false,
        });
        await queryInterface.addColumn('Users', 'is_block', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('Users', 'user_role');
        await queryInterface.removeColumn('Users', 'is_block');
    }
};
