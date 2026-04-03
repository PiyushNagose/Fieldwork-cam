const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    authUserId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    fullName: {
      type: String,
      default: "",
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
    role: {
      type: String,
      enum: ["ADMIN", "VENDOR_OWNER", "STAFF"],
      default: "VENDOR_OWNER",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },
    timezone: {
      type: String,
      default: "",
      trim: true,
    },
    department: {
      type: String,
      default: "",
      trim: true,
    },
    jobTitle: {
      type: String,
      default: "",
      trim: true,
    },
    bio: {
      type: String,
      default: "",
      trim: true,
    },
    profilePhotoUrl: {
      type: String,
      default: "",
      trim: true,
    },
    bannerImageUrl: {
      type: String,
      default: "",
      trim: true,
    },

    meta: {
      firstName: {
        type: String,
        default: "",
        trim: true,
      },
      lastName: {
        type: String,
        default: "",
        trim: true,
      },
      location: {
        type: String,
        default: "",
        trim: true,
      },
      timezone: {
        type: String,
        default: "",
        trim: true,
      },
      department: {
        type: String,
        default: "",
        trim: true,
      },
      jobTitle: {
        type: String,
        default: "",
        trim: true,
      },
      bio: {
        type: String,
        default: "",
        trim: true,
      },
      profilePhotoUrl: {
        type: String,
        default: "",
        trim: true,
      },
      bannerImageUrl: {
        type: String,
        default: "",
        trim: true,
      },
      totalProjects: {
        type: Number,
        default: 0,
      },
      totalVendors: {
        type: Number,
        default: 0,
      },
      totalCompleted: {
        type: Number,
        default: 0,
      },
      approvalRate: {
        type: Number,
        default: 0,
      },
      memberSince: {
        type: Date,
        default: null,
      },
      lastLogin: {
        type: Date,
        default: null,
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
