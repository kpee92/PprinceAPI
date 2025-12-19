"use strict";

/**
 * Migration: Create user_kyc table
 * Purpose:
 * - Sumsub KYC related saari information store karna
 * - User table ko clean rakhna
 * - KYC audit & webhook data maintain karna
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // user_kyc table create kar rahe hain
    await queryInterface.createTable("user_kyc", {
      
      // Primary key (UUID)
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      // User table ka foreign key
      // Har KYC record ek hi user se linked hoga
      userId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "Users", // Users table se relation
          key: "id",
        },
        onUpdate: "CASCADE", // User ID change ho to auto update
        onDelete: "CASCADE", // User delete ho to KYC bhi delete
      },

      // Sumsub ka unique applicant ID
      // Isse webhook events ko user se map karte hain
      applicantId: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },

      // KYC review ka overall status
      // pending   → verification chal rahi hai
      // completed → Sumsub ne final decision de diya
      reviewStatus: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "pending",
      },

      // Sumsub ka final decision
      // GREEN → approved
      // RED   → rejected
      reviewAnswer: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      // Agar KYC reject hui to reason store kar sakte hain
      rejectReason: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      // Last received webhook ka raw JSON
      // Debugging / audit / compliance ke kaam aata hai
      rawWebhook: {
        type: Sequelize.JSON,
        allowNull: true,
      },

      // Record creation timestamp
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },

      // Record update timestamp
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface) {
    // Rollback ke case me table drop kar dena
    await queryInterface.dropTable("user_kyc");
  },
};
