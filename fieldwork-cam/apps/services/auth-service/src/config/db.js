const mongoose = require("mongoose");
const env = require("./env");

const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("Auth Service MongoDB connected");
  } catch (error) {
    console.error("Auth Service DB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;