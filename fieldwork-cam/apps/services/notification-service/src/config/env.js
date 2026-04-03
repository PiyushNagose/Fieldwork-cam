require("dotenv").config();

const env = {
  PORT: process.env.PORT || 4004,

  MONGO_URI: process.env.MONGO_URI,

  JWT_SECRET: process.env.JWT_SECRET || "fieldwork_super_secret",

  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://localhost",

  USER_SERVICE_URL: process.env.USER_SERVICE_URL || "http://localhost:4002",

  NODE_ENV: process.env.NODE_ENV || "development",
};

module.exports = env;
