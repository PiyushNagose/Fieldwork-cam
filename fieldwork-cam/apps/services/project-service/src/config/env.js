require("dotenv").config();

const env = {
  PORT: process.env.PORT || 4003,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET || "fieldwork_super_secret",
  NODE_ENV: process.env.NODE_ENV || "development",
  NOTIFICATION_SERVICE_URL:
    process.env.NOTIFICATION_SERVICE_URL || "http://localhost:4004",
};

module.exports = env;
