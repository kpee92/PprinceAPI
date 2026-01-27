"use strict";
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable("EmailLogs", {
            emailLogId: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
            },
            from: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            to: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            subject: {
                type: Sequelize.STRING,
            },
            status: {
                type: Sequelize.ENUM("SUCCESS", "FAILED"),
            },
            errorMessage: {
                type: Sequelize.TEXT,
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
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable("EmailLogs");
    },
};
