const jwt = require("jsonwebtoken");
const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const User = require("../models/user")(sequelize, DataTypes);
require("dotenv").config();

/**
 * JWT Authentication Middleware
 * Verifies the JWT token from the Authorization header
 * Checks against the database to ensure user exists and is not blocked
 */
const authenticateToken = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  // Verify token
  jwt.verify(token, process.env.JWT_SECRET || "your-secret-key", async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    try {
      // Find user in database to ensure they still exist and check status
      const user = await User.findByPk(decoded.id);

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      if (user.is_block) {
        return res.status(403).json({ error: "Account is blocked. Please contact support." });
      }

      // Attach full user info to request object
      req.user = user;
      next();
    } catch (error) {
      console.error("Auth Middleware Error:", error);
      return res.status(500).json({ error: "Internal server error during authentication" });
    }
  });
};

/**
 * Role Authorization Middleware
 * @param {string[]} roles - Array of allowed roles (e.g. ['admin', 'user'])
 */
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.user_role) {
      return res.status(403).json({ error: "Unauthorized: Role not found" });
    }

    if (!roles.includes(req.user.user_role)) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }

    next();
  };
};

module.exports = { authenticateToken, authorizeRole };
