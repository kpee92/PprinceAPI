const bcrypt = require("bcrypt");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const User = require("../models/user")(sequelize, DataTypes);
const { sendEmail } = require("../utils/email");

const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6-digit token
    const token = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the token for storage
    const hashedToken = await bcrypt.hash(token, 10);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      emailToken: hashedToken,
    });

    // Send verification email
    const verificationUrl = `http://localhost:3000/auth/confirm_email?token=${hashedToken}`;
    const emailResult = await sendEmail(
      email,
      "Email Verification",
      `Hello ${firstName},\n\n`,

      `Please verify your email by clicking the link: ${verificationUrl}`,
      `<p>Please verify your email by clicking the link: <a href="${verificationUrl}">${verificationUrl}</a></p>`,

      `Thank you,`
    );

    if (!emailResult.success) {
      console.error("Failed to send verification email:", emailResult.error);
      // Still proceed with registration, but log the error
    }

    res.status(201).json({
      message:
        "User registered successfully. Please check your email for verification.",
      user: { id: user.id },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const [updated] = await User.update(req.body, {
      where: { id: req.params.id },
    });
    if (updated) {
      const updatedUser = await User.findByPk(req.params.id);
      res.json(updatedUser);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const deleted = await User.destroy({
      where: { id: req.params.id },
    });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const twoFaEnable = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate a secret key
    const secret = speakeasy.generateSecret({
      name: `MyApp (${user.email})`,
      issuer: "MyApp",
    });

    // Save secret to user's twoFaSecret field
    await User.update(
      { twoFaSecret: secret.base32 },
      { where: { id: userId } }
    );

    // Generate QR code URL
    const qrCodeUrl = speakeasy.otpauthURL({
      secret: secret.ascii,
      label: `MyApp (${user.email})`,
      issuer: "MyApp",
    });

    // Generate QR code as data URL
    const qrCodeDataURL = await qrcode.toDataURL(qrCodeUrl);

    res.json({
      message: "2FA setup initiated",
      qrCode: qrCodeDataURL,
      otpauthUrl: qrCodeUrl,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const twoFaVerify = async (req, res) => {
  try {
    const { userId, code } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.twoFaSecret) {
      return res.status(400).json({ error: "2FA not initiated for this user" });
    }

    // Verify the token using the secret from database
    const verified = speakeasy.totp.verify({
      secret: user.twoFaSecret,
      encoding: "base32",
      token: code,
      window: 2, // Allow 2 time windows (30 seconds each)
    });

    if (verified) {
      // Update user with 2FA enabled
      await User.update(
        {
          twoFaStatus: 1,
        },
        { where: { id: userId } }
      );

      res.json({ message: "2FA enabled successfully" });
    } else {
      res.status(400).json({ error: "Invalid 2FA code" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password, twoFaCode } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if email is verified
    if (user.emailVerify !== 1) {
      return res.status(403).json({ error: "Please verify your email first" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check 2FA status
    if (user.twoFaStatus === 1) {
      // 2FA is enabled, require 2FA code
      if (!twoFaCode) {
        return res.status(200).json({
          message: "Please enter your 2FA code",
          requiresTwoFa: true,
          userId: user.id,
        });
      }

      // Verify 2FA code
      const isTwoFaValid = speakeasy.totp.verify({
        secret: user.twoFaSecret,
        encoding: "base32",
        token: twoFaCode,
        window: 2,
      });

      if (!isTwoFaValid) {
        return res.status(401).json({ error: "Invalid 2FA code" });
      }
    }

    // Login successful
    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        twoFaStatus: user.twoFaStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const confirmEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    // Find user with matching emailToken (token is already hashed)
    const user = await User.findOne({ where: { emailToken: token } });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Update user: set emailVerify to 1 and clear emailToken
    await User.update(
      { emailVerify: 1, emailToken: null },
      { where: { id: user.id } }
    );

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    // Find users with emailToken not null
    const users = await User.findAll({
      where: { emailToken: { [require("sequelize").Op.ne]: null } },
    });

    let verifiedUser = null;
    for (const user of users) {
      const isTokenValid = await bcrypt.compare(token, user.emailToken);
      if (isTokenValid) {
        verifiedUser = user;
        break;
      }
    }

    if (!verifiedUser) {
      return res.status(404).json({ error: "Token not found" });
    }

    // Update user: set emailVerify to 1 and clear emailToken
    await User.update(
      { emailVerify: 1, emailToken: null },
      { where: { id: verifiedUser.id } }
    );

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  registerUser,
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  twoFaEnable,
  twoFaVerify,
  loginUser,
  confirmEmail,
  verifyEmail,
};
