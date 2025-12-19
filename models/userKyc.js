"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class UserKyc extends Model {
    static associate(models) {
      // Har KYC record ek hi user se linked hoga
      UserKyc.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });
    }
  }

  UserKyc.init(
    {
      // Primary Key (UUID)
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      // Users table ka reference
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      // Sumsub ka applicantId
      // Webhook events ko identify karne ke liye use hota hai
      applicantId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },

      // KYC process ka current state
      // pending   → verification chal rahi hai
      // completed → final decision aa chuka hai
      reviewStatus: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
      },

      // Sumsub ka final answer
      // GREEN → Approved
      // RED   → Rejected
      reviewAnswer: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // Agar reject hua to reason store hoga
      rejectReason: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // Last webhook ka raw JSON data
      // Debugging & audit ke liye useful
      rawWebhook: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "UserKyc",
      tableName: "user_kyc",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  return UserKyc;
};
