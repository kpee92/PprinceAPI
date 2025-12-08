const express = require("express");
const { confirmEmail, verifyEmail } = require("../controllers/userController");

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

module.exports = router;
