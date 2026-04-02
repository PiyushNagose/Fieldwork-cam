const mongoose = require("mongoose");
const env = require("./env");

const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("Billing Service MongoDB connected");
  } catch (error) {
    console.error("Billing Service DB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;