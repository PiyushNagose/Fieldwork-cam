const mongoose = require("mongoose");
const env = require("./env");

const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("Report Service MongoDB connected");
  } catch (error) {
    console.error("Report Service DB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
