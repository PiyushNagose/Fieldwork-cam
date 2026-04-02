require("dotenv").config();

const env = {
  PORT: process.env.PORT || 4001,
  MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fieldwork_auth",
  JWT_SECRET: process.env.JWT_SECRET || "fieldwork_super_secret",
  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://localhost:5672",
  NODE_ENV: process.env.NODE_ENV || "development",
  APP_WEB_URL: process.env.APP_WEB_URL || "http://localhost:5173",
  EMAIL_FROM: process.env.EMAIL_FROM || "",
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: process.env.SMTP_PORT || "",
  SMTP_SECURE: process.env.SMTP_SECURE || "false",
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
};

module.exports = env;
