const { DataTypes } = require('sequelize');
const sequelize = require('../db');
// const { User, UserKyc } = require("../models");
const User = require("../models/user")(sequelize, DataTypes);
const UserKyc = require("../models/userKyc")(sequelize, DataTypes);
const {
  createApplicant,
  generateAccessToken,
  verifyWebhookSignature,
} = require("../utils/sumsubService");

/**
 * POST /api/kyc/start
 */
exports.startKyc = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Already approved
    if (user.kycStatus === "APPROVED") {
      return res.status(400).json({
        message: "KYC already completed",
      });
    }

    // Create applicant in Sumsub
    const applicantId = await createApplicant(user);

    // Create / update KYC record
    await UserKyc.upsert({
      userId,
      applicantId,
      reviewStatus: "pending",
    });

    // Update user status
    await user.update({ kycStatus: "PENDING" });

    // Generate access token
    const accessToken = await generateAccessToken(applicantId);

    return res.status(200).json({
      message: "KYC started successfully",
      accessToken,
      kycStatus: "PENDING",
    });
  } catch (error) {
    console.error("KYC START ERROR:", error);
    next(error);
  }
};

/**
 * GET /api/kyc/status
 */
exports.getKycStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: ["kycStatus", "kycLevel"],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      kycStatus: user.kycStatus,
      kycLevel: user.kycLevel,
    });
  } catch (error) {
    console.error("KYC STATUS ERROR:", error);
    next(error);
  }
};

/**
 * POST /api/kyc/webhook
 */
exports.sumsubWebhook = async (req, res, next) => {
  try {
    // 🔐 Verify webhook signature
    const isValid = verifyWebhookSignature(req);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid webhook signature" });
    }

    const payload = req.body;
    const applicantId = payload.applicantId;
    const reviewAnswer = payload?.reviewResult?.reviewAnswer;

    if (!applicantId) {
      return res.status(400).json({ message: "ApplicantId missing" });
    }

    const userKyc = await UserKyc.findOne({ where: { applicantId } });

    if (!userKyc) {
      return res.status(404).json({ message: "KYC record not found" });
    }

    // Save webhook raw data
    await userKyc.update({
      rawWebhook: payload,
    });

    if (reviewAnswer === "GREEN") {
      await userKyc.update({
        reviewStatus: "completed",
        reviewAnswer: "GREEN",
      });

      await User.update(
        { kycStatus: "APPROVED" },
        { where: { id: userKyc.userId } }
      );
    }

    if (reviewAnswer === "RED") {
      await userKyc.update({
        reviewStatus: "completed",
        reviewAnswer: "RED",
        rejectReason: payload?.reviewResult?.rejectReason || null,
      });

      await User.update(
        { kycStatus: "REJECTED" },
        { where: { id: userKyc.userId } }
      );
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("SUMSUB WEBHOOK ERROR:", error);
    next(error);
  }
};
