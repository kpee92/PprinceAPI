'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CryptoTransfer extends Model {
    static associate(models) {
      // Association with User
      CryptoTransfer.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
      });

      // Optional: association with Payment if linked
      CryptoTransfer.belongsTo(models.Payment, {
        foreignKey: 'paymentId',
        as: 'payment',
      });
    }
  }

  CryptoTransfer.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "Users",
          key: "id",
        },
      },
      paymentId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "Payments",
          key: "id",
        },
      },
      cryptoAmount: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cryptoCurrency: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      walletAddress: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fromWalletAddress: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      network: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      txHash: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isProcessed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Indicates whether crypto transfer process has been executed (true = processed, false = pending)',
      },

      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending', // pending, success, failed
      },
    },
    {
      sequelize,
      modelName: 'CryptoTransfer',
      tableName: 'CryptoTransfers',
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    }
  );

  return CryptoTransfer;
};
