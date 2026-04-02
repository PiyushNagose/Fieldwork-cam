const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema(
  {
    projectId: {
      type: String,
      required: true,
      index: true,
    },
    uploadedByAuthUserId: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      default: "",
    },
    fileName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      default: "",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    gpsLatitude: {
      type: Number,
      default: null,
    },
    gpsLongitude: {
      type: Number,
      default: null,
    },
    timestampCaptured: {
      type: Date,
      default: null,
    },
    workOrderNumber: {
      type: String,
      default: "",
    },
    aiStatus: {
      type: String,
      enum: ["Pending", "Passed", "Failed"],
      default: "Pending",
    },
    aiScore: {
      type: Number,
      default: 0,
    },
    aiChecks: {
      clarity: { type: Boolean, default: false },
      lighting: { type: Boolean, default: false },
      subjectCoverage: { type: Boolean, default: false },
      gpsVerification: { type: Boolean, default: false },
      timestampValid: { type: Boolean, default: false },
    },
    isSubmitted: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Photo", photoSchema);
