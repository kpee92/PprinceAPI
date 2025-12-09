const express = require("express");
const {
  confirmEmail,
  verifyEmail,
  forgotPassword,
  updatePassword,
} = require("../controllers/userController");

const router = express.Router();

/**
 * @swagger
 * /auth/confirm_email:
 *   get:
 *     summary: Confirm email with token
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 */
router.get("/confirm_email", confirmEmail);

/**
 * @swagger
 * /auth/verify_email:
 *   post:
 *     summary: Verify email with token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 */
router.post("/verify_email", verifyEmail);

/**
 * @swagger
 * /auth/forgot_password:
 *   post:
 *     summary: Request password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset email sent
 */
router.post("/forgot_password", forgotPassword);

/**
 * @swagger
 * /auth/update_password:
 *   post:
 *     summary: Update password with reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 */
router.post("/update_password", updatePassword);

module.exports = router;
