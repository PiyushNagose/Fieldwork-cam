const mongoose = require("mongoose");

const authUserSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      default: "",
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["ADMIN", "VENDOR_OWNER", "STAFF"],
      default: "VENDOR_OWNER",
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    otpCode: {
      type: String,
      default: "",
    },
    otpExpiresAt: {
      type: Date,
      default: null,
    },

    inviteToken: {
      type: String,
      default: "",
      index: true,
    },
    inviteExpiresAt: {
      type: Date,
      default: null,
    },
    inviteAccepted: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["INVITED", "ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AuthUser", authUserSchema);
