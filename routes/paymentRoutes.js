const express = require("express");
const { preAuthorizePayment, capturePayment, managePayment, userPaymentHistory, handleSetopayWebhook } = require("../controllers/paymentController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /payments/pre-authorize:
 *   post:
 *     summary: Pre-authorize a payment
 *     description: Initiate a server-to-server POST request with payment data. The payment details are verified with the issuer, and the funds are reserved. The response contains an id that should be stored and used in subsequent back-office operations.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - currency
 *               - paymentBrand
 *               - card
 *             properties:
 *               amount:
 *                 type: string
 *                 example: "92.00"
 *                 description: Payment amount
 *               currency:
 *                 type: string
 *                 example: "EUR"
 *                 description: Currency code
 *               paymentBrand:
 *                 type: string
 *                 example: "VISA"
 *                 description: Payment brand (VISA, MASTER, etc.)
 *               paymentType:
 *                 type: string
 *                 example: "PA"
 *                 description: "Payment type - will be automatically set to 'PA' (Pre-Authorization) for this endpoint. Do not use 'DB' (Debit) as it immediately captures the payment."
 *                 readOnly: true
 *               card:
 *                 type: object
 *                 required:
 *                   - number
 *                   - holder
 *                   - expiryMonth
 *                   - expiryYear
 *                   - cvv
 *                 properties:
 *                   number:
 *                     type: string
 *                     example: "4200000000000000"
 *                     description: Card number
 *                   holder:
 *                     type: string
 *                     example: "Jane Jones"
 *                     description: Cardholder name
 *                   expiryMonth:
 *                     type: string
 *                     example: "05"
 *                     description: Expiry month (MM)
 *                   expiryYear:
 *                     type: string
 *                     example: "2034"
 *                     description: Expiry year (YYYY)
 *                   cvv:
 *                     type: string
 *                     example: "123"
 *                     description: CVV code
 *     responses:
 *       200:
 *         description: Payment pre-authorized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Payment ID to be used in subsequent operations
 *                 result:
 *                   type: object
 *       400:
 *         description: Bad request - missing required fields
 *       500:
 *         description: Payment processing failed
 */
router.post("/pre-authorize", authenticateToken, preAuthorizePayment);
// router.post("/pre-authorize",  preAuthorizePayment);

/**
 * @swagger
 * /payments/capture/{paymentId}:
 *   post:
 *     summary: Capture a pre-authorized payment
 *     description: Initiate a server-to-server POST request over the pre-authorized payment. The reserved funds are transferred from the shopper's account to the merchant's account.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The payment ID from the pre-authorization response
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - currency
 *             properties:
 *               amount:
 *                 type: string
 *                 example: "92.00"
 *                 description: Payment amount to capture
 *               currency:
 *                 type: string
 *                 example: "EUR"
 *                 description: Currency code
 *     responses:
 *       200:
 *         description: Payment captured successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Payment ID
 *                 result:
 *                   type: object
 *       400:
 *         description: Bad request - missing required fields
 *       500:
 *         description: Payment capture failed
 */
router.post("/capture/:paymentId", authenticateToken, capturePayment);

/**
 * @swagger
 * /payments/manage/{paymentId}:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Manage a captured payment
 *     description: "Initiate a back-office server-to-server POST request over the captured payment. Supports operations: refund, rebill, chargeback, and chargeback reversal."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The payment ID from the capture response
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - operation
 *               - amount
 *               - currency
 *             properties:
 *               operation:
 *                 type: string
 *                 enum:
 *                   - refund
 *                   - rebill
 *                   - chargeback
 *                   - "chargeback reversal"
 *                 example: "refund"
 *                 description: The operation to perform on the payment
 *               amount:
 *                 type: string
 *                 example: "92.00"
 *                 description: Amount for the operation
 *               currency:
 *                 type: string
 *                 example: "EUR"
 *                 description: Currency code
 *     responses:
 *       200:
 *         description: Payment operation completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Payment ID
 *                 result:
 *                   type: object
 *       400:
 *         description: Bad request - missing required fields or invalid operation
 *       500:
 *         description: Payment management failed
 */
router.post("/manage/:paymentId", authenticateToken, managePayment);

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Receive Setopay Payment Webhook
 *     description: Endpoint for Setopay server-to-server notifications.
 *     tags:
 *       - Payments
 *     responses:
 *       200:
 *         description: Webhook received processed
 */
router.post("/webhook", handleSetopayWebhook);

/**
 * @swagger
 * /payments/history:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Get user payment history
 *     description: "Fetch all payment records for the authenticated user. Supports optional filtering by status and pagination."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, success, failed, refunded, chargeback, chargeback_reversed]
 *         description: Filter payments by status
 *         required: false
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Maximum number of payments to return
 *         required: false
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of payments to skip for pagination
 *         required: false
 *     responses:
 *       200:
 *         description: Payment history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         description: Payment record ID
 *                       userId:
 *                         type: string
 *                         format: uuid
 *                         description: User ID
 *                       currency:
 *                         type: string
 *                         example: "EUR"
 *                         description: Currency code
 *                       amount:
 *                         type: string
 *                         example: "92.00"
 *                         description: Payment amount
 *                       paymentBrand:
 *                         type: string
 *                         example: "VISA"
 *                         description: Payment brand
 *                       paymentType:
 *                         type: string
 *                         example: "DB"
 *                         description: Payment type
 *                       card:
 *                         type: object
 *                         description: Card information (masked)
 *                       paymentId:
 *                         type: string
 *                         description: Payment ID from payment gateway
 *                       referenceId:
 *                         type: string
 *                         description: Reference ID
 *                       status:
 *                         type: string
 *                         enum: [pending, success, failed, refunded, chargeback, chargeback_reversed]
 *                         example: "success"
 *                         description: Payment status
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Payment creation timestamp
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         description: Payment last update timestamp
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of payments matching the filter
 *                     limit:
 *                       type: integer
 *                       description: Maximum number of payments returned
 *                     offset:
 *                       type: integer
 *                       description: Number of payments skipped
 *                     count:
 *                       type: integer
 *                       description: Number of payments in current response
 *       401:
 *         description: Unauthorized - authentication required
 *       500:
 *         description: Failed to fetch payment history
 */
router.post("/history", authenticateToken, userPaymentHistory);

module.exports = router;

