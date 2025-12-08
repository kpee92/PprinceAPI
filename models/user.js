"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // define association here
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
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
      emailVerify: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
      },
      twoFaSecret: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      twoFaStatus: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
      },
      isDelete: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
      },
      otp: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      emailToken: {
        type: DataTypes.STRING,
        defaultValue: null,
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
