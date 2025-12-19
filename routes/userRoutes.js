const express = require("express");
const {
  registerUser,
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  twoFaEnable,
  twoFaVerify,
  loginUser,
} = require("../controllers/userController");
const { addWallet, getWallets } = require("../controllers/walletController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
router.get("/", authenticateToken, getUsers);

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post("/register", registerUser);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user (without password hashing)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created
 */
router.post("/", authenticateToken, createUser);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Login user with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               twoFaCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful or requires 2FA
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 */
router.post("/login", loginUser);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User data
 */
router.get("/:id", authenticateToken, getUserById);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 */
router.put("/:id", authenticateToken, updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: User deleted
 */
router.delete("/:id", authenticateToken, deleteUser);

/**
 * @swagger
 * /users/twofa/enable:
 *   post:
 *     summary: Enable 2FA for a user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: 2FA setup data with QR code
 */
router.post("/twofa/enable", authenticateToken, twoFaEnable);

/**
 * @swagger
 * /users/twofa/verify:
 *   post:
 *     summary: Verify 2FA code and enable 2FA
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: 2FA enabled successfully
 */
router.post("/twofa/verify", authenticateToken, twoFaVerify);

/**
 * @swagger
 * /users/add-wallet:
 *   post:
 *     summary: Add a wallet for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               walletAddress:
 *                 type: string
 *               network:
 *                 type: string
 *     responses:
 *       201:
 *         description: Wallet added successfully
 */
router.post("/add-wallet", authenticateToken, addWallet);

/**
 * @swagger
 * /users/wallets:
 *   post:
 *     summary: Get all wallets for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's wallets
 */
router.post("/wallets", authenticateToken, getWallets);

//router.post('/setopay', handleSetopayWebhook);

module.exports = router;
