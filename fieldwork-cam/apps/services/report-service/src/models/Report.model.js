const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    projectId: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    workOrderNumber: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: "Project Report",
    },
    address: {
      type: String,
      default: "",
    },
    vendorAuthUserId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["Draft", "In Review", "Completed", "Pending"],
      default: "Draft",
    },
    progress: {
      type: Number,
      default: 0,
    },
    summary: {
      totalCategories: { type: Number, default: 0 },
      aiQualityScore: { type: Number, default: 0 },
      gpsStatus: { type: String, default: "Unknown" },
      timeOnSite: { type: String, default: "" },
    },
    categories: [
      {
        category: String,
        photos: [
          {
            photoId: String,
            fileUrl: String,
            capturedAt: Date,
          },
        ],
      },
    ],
    notes: [
      {
        text: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);