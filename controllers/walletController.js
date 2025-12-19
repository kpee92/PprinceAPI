const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Wallet = require("../models/wallet")(sequelize, DataTypes);

const addWallet = async (req, res) => {
  try {
    const { walletAddress, network } = req.body;
    const userId = req.user.id; // from auth middleware

    if (!walletAddress || !network) {
      return res.status(400).json({ error: "walletAddress and network are required" });
    }

    const wallet = await Wallet.create({
      userId,
      walletAddress,
      network,
    });

    res.status(201).json({
      message: "Wallet added successfully",
      wallet,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getWallets = async (req, res) => {
  try {
    const userId = req.user.id;

    const wallets = await Wallet.findAll({
      where: { userId },
    });

    res.json(wallets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addWallet,
  getWallets,
};