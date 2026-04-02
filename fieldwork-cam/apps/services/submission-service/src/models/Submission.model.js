const mongoose = require("mongoose");

const timelineEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      default: "",
    },
    actorAuthUserId: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    projectId: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    vendorAuthUserId: {
      type: String,
      required: true,
      index: true,
    },
    photoIds: {
      type: [String],
      default: [],
    },
    aiAverageScore: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Submitted", "Approved", "Rejected", "Retake Requested"],
      default: "Submitted",
    },
    adminComments: {
      type: String,
      default: "",
    },
    reviewedByAuthUserId: {
      type: String,
      default: "",
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    timeline: {
      type: [timelineEventSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);