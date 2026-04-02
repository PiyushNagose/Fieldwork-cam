require("dotenv").config();

const env = {
  PORT: process.env.PORT || 4002,
  MONGO_URI:
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fieldwork_users",
  JWT_SECRET: process.env.JWT_SECRET || "fieldwork_super_secret",
  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://localhost:5672",
  NODE_ENV: process.env.NODE_ENV || "development",
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || "http://localhost:4001",
};

module.exports = env;
