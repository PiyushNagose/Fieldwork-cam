const mongoose = require("mongoose");

const staffProfileSchema = new mongoose.Schema(
  {
    authUserId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    vendorAuthUserId: {
      type: String,
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    location: {
      type: String,
      default: "",
      trim: true,
    },
    profilePhotoUrl: {
      type: String,
      default: "",
      trim: true,
    },
    roleTitle: {
      type: String,
      default: "",
      trim: true,
    },
    inviteMethod: {
      type: String,
      enum: ["SMS", "EMAIL"],
      default: "EMAIL",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "ON_LEAVE"],
      default: "ACTIVE",
    },
    specialties: {
      type: [String],
      default: [],
    },
    assignedProjectIds: {
      type: [String],
      default: [],
    },
    completedJobs: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
    },
    lastActiveAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("StaffProfile", staffProfileSchema);
