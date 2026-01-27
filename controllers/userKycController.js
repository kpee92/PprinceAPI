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
exports.startKyc = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ STEP 1: Check existing KYC record
    let userKyc = await UserKyc.findOne({ where: { userId } });

    let applicantId;

    if (!userKyc) {
      // 🔹 First time only
      applicantId = await createApplicant(user);

      await User.update(
        {
          kycStatus: "PENDING",
          kycLevel: "basic" // ya jo level tum use kar rahe ho
        },
        { where: { id: userId } }
      )

      userKyc = await UserKyc.create({
        userId,
        applicantId,
        reviewStatus: "INITIATED"
      });
    } else {
      // 🔹 Resume case
      applicantId = userKyc.applicantId;
    }

    // ✅ STEP 2: ALWAYS generate fresh SDK token
    const accessToken = await generateAccessToken(applicantId);

    return res.json({
      accessToken,
      reviewStatus: userKyc.reviewStatus
    });

  } catch (err) {
    console.error("START KYC ERROR:", err);
    return res.status(500).json({
      error: "Unable to start or resume KYC"
    });
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
exports.sumsubWebhook = async (req, res) => {
  try {
    // 🔥 DEBUG LOGS (MOST IMPORTANT)
    console.log("🔥🔥 SUMSUB WEBHOOK HIT 🔥🔥");
    console.log("➡️ URL:", req.originalUrl);
    console.log("➡️ Method:", req.method);
    console.log("➡️ Headers:", req.headers);
    console.log("➡️ Content-Type:", req.headers["content-type"]);
    console.log("➡️ rawBody exists:", !!req.rawBody);

    if (req.rawBody) {
      console.log("➡️ rawBody string:", req.rawBody.toString());
    }

    // 🔐 Step 1: Verify signature
    const isValid = verifyWebhookSignature(req);
    console.log("➡️ Signature valid:", isValid);

    if (!isValid) {
      console.log("❌ INVALID WEBHOOK SIGNATURE");
      return res.status(401).json({ message: "Invalid webhook signature" });
    }

    // 🔹 Step 2: Parse payload
    const payload = JSON.parse(req.rawBody.toString());
    console.log("➡️ Parsed payload:", payload);

    const applicantId = payload.applicantId;
    const reviewAnswer = payload?.reviewResult?.reviewAnswer || null;

    console.log("➡️ applicantId:", applicantId);
    console.log("➡️ reviewAnswer:", reviewAnswer);

    if (!applicantId) {
      console.log("⚠️ applicantId missing");
      return res.status(200).json({ success: true });
    }

    // 🔹 Step 3: Find KYC record
    const userKyc = await UserKyc.findOne({ where: { applicantId } });
    console.log("➡️ userKyc found:", !!userKyc);

    if (!userKyc) {
      console.log("⚠️ userKyc not found for applicantId");
      return res.status(200).json({ success: true });
    }

    // 🔒 Step 4: Prevent duplicate processing
    if (userKyc.reviewStatus === "completed") {
      console.log("ℹ️ KYC already completed, skipping update");
      return res.status(200).json({ success: true });
    }

    // 🔹 Step 5: Save raw webhook
    await userKyc.update({ rawWebhook: payload });
    console.log("✅ rawWebhook saved");

    // 🔹 Step 6: Handle review result
    if (reviewAnswer === "GREEN") {
      console.log("🟢 KYC APPROVED");

      await userKyc.update({
        reviewStatus: "completed",
        reviewAnswer: "GREEN",
      });

      await User.update(
        { kycStatus: "APPROVED" },
        { where: { id: userKyc.userId } }
      );
    }
    else if (reviewAnswer === "RED") {
      console.log("🔴 KYC REJECTED");

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
    else {
      console.log("🟡 KYC PENDING / IN REVIEW");

      await userKyc.update({
        reviewStatus: "pending",
        reviewAnswer,
      });
    }

    console.log("✅ WEBHOOK PROCESSED SUCCESSFULLY");
    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("💥 SUMSUB WEBHOOK ERROR:", err);
    // ❗ NEVER throw / next(err) in webhook
    return res.status(200).json({ success: false });
  }
};