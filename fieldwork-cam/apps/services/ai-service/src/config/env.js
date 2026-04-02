require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 4006,
  JWT_SECRET: process.env.JWT_SECRET || "fieldwork_super_secret",
  MEDIA_SERVICE_URL: process.env.MEDIA_SERVICE_URL || "http://localhost:4005",
  MONGO_URI: process.env.MONGO_URI,
};
