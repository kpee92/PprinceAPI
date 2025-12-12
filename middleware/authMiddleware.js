const jwt = require("jsonwebtoken");

/**
 * JWT Authentication Middleware
 * Verifies the JWT token from the Authorization header
 */
const authenticateToken = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  // Verify token
  jwt.verify(token, process.env.JWT_SECRET || "your-secret-key", (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    // Attach user info to request object
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };

