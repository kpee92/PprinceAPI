// "use strict";
// const { Model } = require("sequelize");

// module.exports = (sequelize, DataTypes) => {
//   class Payment extends Model {
//     static associate(models) {
//       // define association here
//       Payment.belongsTo(models.User, {
//         foreignKey: "userId",
//         as: "user",
//       });
//     }
//   }

//   Payment.init(
//     {
//       id: {
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV4,
//         primaryKey: true,
//       },
//       userId: {
//         type: DataTypes.UUID,
//         allowNull: false,
//         references: {
//           model: "Users",
//           key: "id",
//         },
//       },
//       currency: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       amount: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       paymentBrand: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       paymentType: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       card: {
//         type: DataTypes.JSON,
//         allowNull: true,
//       },
//       paymentId: {
//         type: DataTypes.STRING,
//         allowNull: true,
//         comment: "Payment ID from payment gateway response",
//       },
//       referenceId: {
//         type: DataTypes.STRING,
//         allowNull: true,
//       },
//       cryptoAmount: {
//         type: DataTypes.STRING,
//         allowNull: true,
//       },
//       cryptoCurrency: {
//         type: DataTypes.STRING,
//         allowNull: true,
//       },
//       walletAddress: {
//         type: DataTypes.STRING,
//         allowNull: true,
//       },
//       transferStatus: {
//         type: DataTypes.STRING,
//         allowNull: false,
//         defaultValue: 'pending',
//       },
//       status: {
//         type: DataTypes.STRING,
//         defaultValue: "pending",
//         allowNull: false,
//       },
//     },
//     {
//       sequelize,
//       modelName: "Payment",
//       tableName: "Payments",
//       timestamps: true,
//       createdAt: "createdAt",
//       updatedAt: "updatedAt",
//     }
//   );

//   return Payment;
// };

"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      // define association here
      Payment.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });
    }
  }

  Payment.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      amount: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      paymentBrand: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      paymentType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      card: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      paymentId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Payment ID from payment gateway response",
      },
      referenceId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      cryptoAmount: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      cryptoCurrency: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      walletAddress: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      fromWalletAddress: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      network: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      transferStatus: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "pending",
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Payment",
      tableName: "Payments",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  return Payment;
};

