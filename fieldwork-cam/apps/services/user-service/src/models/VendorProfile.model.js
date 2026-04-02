const mongoose = require("mongoose");

const vendorProfileSchema = new mongoose.Schema(
  {
    authUserId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    businessEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    businessPhone: {
      type: String,
      trim: true,
      default: "",
    },
    website: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    taxId: {
      type: String,
      trim: true,
      default: "",
    },
    identityDocumentUrl: {
      type: String,
      default: "",
    },
    serviceArea: {
      type: String,
      default: "",
    },
    serviceTypes: {
      type: [String],
      default: [],
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("VendorProfile", vendorProfileSchema);
