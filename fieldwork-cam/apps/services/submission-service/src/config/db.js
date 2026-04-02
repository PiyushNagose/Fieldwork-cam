const mongoose = require("mongoose");
const env = require("./env");

const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("Submission Service MongoDB connected");
  } catch (error) {
    console.error("Submission Service DB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;