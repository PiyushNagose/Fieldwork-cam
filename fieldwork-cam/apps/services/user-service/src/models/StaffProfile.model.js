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
    roleTitle: {
      type: String,
      default: "",
      trim: true,
    },
    inviteMethod: {
      type: String,
      enum: ["SMS", "Email"],
      default: "SMS",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    assignedProjectIds: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("StaffProfile", staffProfileSchema);
