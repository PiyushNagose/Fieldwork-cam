require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 4007,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET || "fieldwork_super_secret",
  MEDIA_SERVICE_URL: process.env.MEDIA_SERVICE_URL || "http://localhost:4005",
  PROJECT_SERVICE_URL: process.env.PROJECT_SERVICE_URL || "http://localhost:4003",
};