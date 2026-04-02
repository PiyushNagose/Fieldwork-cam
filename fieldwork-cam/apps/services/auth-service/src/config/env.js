require("dotenv").config();

const env = {
  PORT: process.env.PORT || 4001,
  MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fieldwork_auth",
  JWT_SECRET: process.env.JWT_SECRET || "fieldwork_super_secret",
  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://localhost:5672",
  NODE_ENV: process.env.NODE_ENV || "development",
};

module.exports = env;