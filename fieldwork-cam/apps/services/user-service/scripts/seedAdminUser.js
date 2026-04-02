const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../src/models/User.model");

const MONGO_URI = process.env.MONGO_URI;
const AUTH_USER_ID = process.env.AUTH_USER_ID;

async function seedAdminUser() {
  try {
    if (!AUTH_USER_ID) {
      throw new Error("AUTH_USER_ID is required in environment");
    }

    await mongoose.connect(MONGO_URI);

    const existing = await User.findOne({ authUserId: AUTH_USER_ID });

    if (existing) {
      console.log("⚠️ Admin user already exists");
      process.exit();
    }

    await User.create({
      authUserId: AUTH_USER_ID,
      phone: "9999999999",
      fullName: "Sarah Kowalski",
      email: "admin@example.com",
      role: "ADMIN",
      isVerified: true,
      status: "ACTIVE",
      location: "Miami, FL",
      timezone: "Eastern Time (ET) — UTC-5",
      department: "Field Operations",
      jobTitle: "Operations Manager",
      bio: "Experienced operations manager handling projects, vendors, and field service workflows.",
      profilePhotoUrl: "",
      meta: {
        firstName: "Sarah",
        lastName: "Kowalski",
        location: "Miami, FL",
        timezone: "Eastern Time (ET) — UTC-5",
        department: "Field Operations",
        jobTitle: "Operations Manager",
        bio: "Experienced operations manager handling projects, vendors, and field service workflows.",
        profilePhotoUrl: "",
        totalProjects: 24,
        totalVendors: 8,
        totalCompleted: 142,
        approvalRate: 87,
        memberSince: new Date("2024-01-15T00:00:00.000Z"),
        lastLogin: new Date(),
      },
    });

    console.log("✅ Admin user seeded successfully");
    process.exit();
  } catch (error) {
    console.error("❌ Error seeding admin user:", error.message);
    process.exit(1);
  }
}

seedAdminUser();