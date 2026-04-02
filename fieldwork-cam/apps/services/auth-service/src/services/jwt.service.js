const jwt = require("jsonwebtoken");
const env = require("../config/env");

const generateToken = (user) => {
  const payload = {
    userId: user._id?.toString() || user.userId,
    role: user.role,
    phone: user.phone || null,
    email: user.email || null,
  };

  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
};

module.exports = { generateToken };
