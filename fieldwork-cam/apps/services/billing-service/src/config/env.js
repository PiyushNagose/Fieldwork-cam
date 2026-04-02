require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 4008,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET || "fieldwork_super_secret",
};