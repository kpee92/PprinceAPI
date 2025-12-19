// "use strict";
// const { Model } = require("sequelize");

// module.exports = (sequelize, DataTypes) => {
//   class User extends Model {
//     static associate(models) {
//       User.hasMany(models.Wallet, { foreignKey: 'userId', as: 'wallets' });
//     }
//   }

//   User.init(
//     {
//       id: {
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV4,
//         primaryKey: true,
//       },
//       firstName: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       lastName: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       email: {
//         type: DataTypes.STRING,
//         allowNull: false,
//         unique: true,
//       },
//       password: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       emailVerify: {
//         type: DataTypes.TINYINT,
//         defaultValue: 0,
//       },
//       twoFaSecret: {
//         type: DataTypes.STRING,
//         defaultValue: null,
//       },
//       twoFaStatus: {
//         type: DataTypes.TINYINT,
//         defaultValue: 0,
//       },
//       isDelete: {
//         type: DataTypes.TINYINT,
//         defaultValue: 0,
//       },
//       otp: {
//         type: DataTypes.STRING,
//         defaultValue: null,
//       },
//       emailToken: {
//         type: DataTypes.STRING,
//         defaultValue: null,
//       },
//       resetToken: {
//         type: DataTypes.STRING,
//         defaultValue: null,
//       },
//     },
//     {
//       sequelize,
//       modelName: "User",
//       timestamps: true,
//       createdAt: "createdAt",
//       updatedAt: "updatedAt",
//     }
//   );

//   return User;
// };


"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // User ↔ Wallet relation (existing)
      User.hasMany(models.Wallet, {
        foreignKey: "userId",
        as: "wallets",
      });

      // User ↔ KYC relation (NEW)
      User.hasOne(models.UserKyc, {
        foreignKey: "userId",
        as: "kyc",
      });
    }
  }

  User.init(
    {
      // Primary Key
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      // Basic user info
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      // Email verification
      emailVerify: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
      },

      // 2FA related fields
      twoFaSecret: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      twoFaStatus: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
      },

      // Soft delete flag
      isDelete: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
      },

      // OTP / tokens
      otp: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      emailToken: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      resetToken: {
        type: DataTypes.STRING,
        defaultValue: null,
      },

      // =========================
      // 🔐 KYC RELATED FIELDS (NEW)
      // =========================

      // Overall KYC status (fast access ke liye)
      // NOT_STARTED → user ne KYC start nahi ki
      // PENDING     → documents submit ho gaye
      // APPROVED    → KYC verified
      // REJECTED    → KYC failed
      kycStatus: {
        type: DataTypes.ENUM(
          "NOT_STARTED",
          "PENDING",
          "APPROVED",
          "REJECTED"
        ),
        defaultValue: "NOT_STARTED",
      },

      // KYC level (future use)
      // basic / full
      kycLevel: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  return User;
};
