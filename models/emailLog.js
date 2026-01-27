"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class EmailLog extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    EmailLog.init(
        {
            emailLogId: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            from: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            to: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            subject: {
                type: DataTypes.STRING,
            },
            status: {
                type: DataTypes.ENUM("SUCCESS", "FAILED"),
            },
            errorMessage: {
                type: DataTypes.TEXT,
            },
        },
        {
            sequelize,
            modelName: "EmailLog",
        }
    );
    return EmailLog;
};
