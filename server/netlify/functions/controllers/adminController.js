const jwt = require("jsonwebtoken");

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;

/**
 * Admin login - validates API key and returns JWT token
 */
async function login(req, res) {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: "API key is required",
      });
    }

    // Validate API key
    if (apiKey !== ADMIN_API_KEY) {
      return res.status(401).json({
        success: false,
        message: "Invalid API key",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        admin: true,
        timestamp: Date.now(),
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.json({
      success: true,
      token,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
}

/**
 * Verify JWT token
 */
async function verifyToken(req, res) {
  try {
    // If we reach here, the auth middleware has already validated the token
    return res.json({
      success: true,
      admin: true,
      message: "Token is valid",
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({
      success: false,
      message: "Token verification failed",
    });
  }
}

/**
 * Logout (client-side should remove token)
 */
async function logout(req, res) {
  return res.json({
    success: true,
    message: "Logged out successfully",
  });
}

module.exports = {
  login,
  verifyToken,
  logout,
};
