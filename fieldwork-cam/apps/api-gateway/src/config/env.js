require("dotenv").config();

const env = {
  PORT: process.env.PORT || 4000,
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || "http://localhost:4001",
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || "http://localhost:4002",
  PROJECT_SERVICE_URL:
    process.env.PROJECT_SERVICE_URL || "http://localhost:4003",
  NOTIFICATION_SERVICE_URL:
    process.env.NOTIFICATION_SERVICE_URL || "http://localhost:4004",
  JWT_SECRET: process.env.JWT_SECRET || "fieldwork_super_secret",
  Media_SERVICE_URL: process.env.MEDIA_SERVICE_URL || "http://localhost:4005",
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || "http://localhost:4006",
  REPORT_SERVICE_URL: process.env.REPORT_SERVICE_URL || "http://localhost:4007",
  BILLING_SERVICE_URL:
    process.env.BILLING_SERVICE_URL || "http://localhost:4008",
  SUBMISSION_SERVICE_URL:
    process.env.SUBMISSION_SERVICE_URL || "http://localhost:4009",
};

module.exports = env;
