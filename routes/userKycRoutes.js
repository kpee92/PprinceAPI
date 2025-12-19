
// const express = require("express");
// const router = express.Router();

// const {
//   startKyc,
//   getKycStatus,
//   sumsubWebhook,
// } = require("../controllers/userKycController");

// // const authMiddleware = require("../middlewares/auth.middleware");
// const { authenticateToken } = require("../middleware/authMiddleware");

// // User KYC start
// router.post("/startKyc", authenticateToken, startKyc);

// // User KYC status
// router.get("/kycStatus", authenticateToken, getKycStatus);

// // Sumsub webhook (NO auth middleware)
// router.post("/webhookSumsub", sumsubWebhook);

// module.exports = router;



const express = require("express");
const router = express.Router();

const {
  startKyc,
  getKycStatus,
  sumsubWebhook,
} = require("../controllers/userKycController");

const { authenticateToken } = require("../middleware/authMiddleware");

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   - name: KYC
 *     description: User KYC (Sumsub) related APIs
 */

/**
 * @swagger
 * /api/kyc/startKyc:
 *   post:
 *     summary: Start KYC process for logged-in user
 *     tags:
 *       - KYC
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Creates Sumsub applicant, generates SDK access token
 *       and marks user KYC status as PENDING.
 *     responses:
 *       200:
 *         description: KYC started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: KYC started successfully
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
 *                 kycStatus:
 *                   type: string
 *                   example: PENDING
 *       400:
 *         description: KYC already completed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/startKyc", authenticateToken, startKyc);

/**
 * @swagger
 * /api/kyc/kycStatus:
 *   get:
 *     summary: Get current KYC status of logged-in user
 *     tags:
 *       - KYC
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KYC status fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 kycStatus:
 *                   type: string
 *                   example: APPROVED
 *                 kycLevel:
 *                   type: string
 *                   example: full
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get("/kycStatus", authenticateToken, getKycStatus);

/**
 * @swagger
 * /api/kyc/webhookSumsub:
 *   post:
 *     summary: Sumsub webhook for KYC status updates
 *     tags:
 *       - KYC
 *     description: |
 *       This endpoint is called by Sumsub servers only.
 *       It updates user KYC status based on review result.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               applicantId:
 *                 type: string
 *                 example: 64fdxxxxxx
 *               type:
 *                 type: string
 *                 example: applicantReviewed
 *               reviewResult:
 *                 type: object
 *                 properties:
 *                   reviewAnswer:
 *                     type: string
 *                     example: GREEN
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       401:
 *         description: Invalid webhook signature
 *       404:
 *         description: KYC record not found
 *       500:
 *         description: Internal server error
 */
router.post("/webhookSumsub", sumsubWebhook);

module.exports = router;


// Is API ka URL kahan use hoga?
// 👉 Sumsub Dashboard me

// Steps:

// Sumsub Dashboard open karo

// Developers / Webhooks section me jao

// Webhook URL add karo 👇