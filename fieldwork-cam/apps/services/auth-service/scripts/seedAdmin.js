const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const AuthUser = require("../src/models/AuthUser.model");

const MONGO_URI = process.env.MONGO_URI;

async function seedAdmin() {
  try {
    await mongoose.connect(MONGO_URI);

    const existing = await AuthUser.findOne({
      email: "admin@example.com",
    });

    if (existing) {
      console.log("⚠️ Admin already exists");
      console.log("AUTH_USER_ID=" + existing._id.toString());
      process.exit();
    }

    const passwordHash = await bcrypt.hash("admin123", 10);

    const admin = await AuthUser.create({
      phone: "9999999999",
      email: "admin@example.com",
      passwordHash,
      role: "ADMIN",
      isPhoneVerified: true,
      isEmailVerified: true,
    });

    console.log("✅ Admin seeded successfully");
    console.log("AUTH_USER_ID=" + admin._id.toString());
    process.exit();
  } catch (error) {
    console.error("❌ Error seeding admin:", error.message);
    process.exit(1);
  }
}

seedAdmin();
