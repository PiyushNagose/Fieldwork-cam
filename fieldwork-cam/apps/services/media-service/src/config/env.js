require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 4005,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET || "fieldwork_super_secret",
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
  BASE_URL: process.env.BASE_URL || "http://localhost:4005",
};