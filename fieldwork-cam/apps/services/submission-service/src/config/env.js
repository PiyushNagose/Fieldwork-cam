require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 4009,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET || "fieldwork_super_secret",
  PROJECT_SERVICE_URL: process.env.PROJECT_SERVICE_URL || "http://localhost:4003",
  MEDIA_SERVICE_URL: process.env.MEDIA_SERVICE_URL || "http://localhost:4005",
  NOTIFICATION_SERVICE_URL:
    process.env.NOTIFICATION_SERVICE_URL || "http://localhost:4004",
};
