const mongoose = require("mongoose");

const projectNoteSchema = new mongoose.Schema(
  {
    note: {
      type: String,
      required: true,
      trim: true,
    },
    createdByAuthUserId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const projectAssignmentSchema = new mongoose.Schema(
  {
    staffId: {
      type: String,
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const projectChecklistSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    required: {
      type: Boolean,
      default: false,
    },
    captureType: {
      type: String,
      default: "STANDARD",
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const projectSchema = new mongoose.Schema(
  {
    workOrderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    serviceType: {
      type: String,
      default: "",
      trim: true,
    },
    serviceId: {
      type: String,
      default: "",
      trim: true,
    },
    clientName: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "New",
        "In Progress",
        "Submitted",
        "Approved",
        "Completed",
        "Rejected",
        "Retake Requested",
      ],
      default: "New",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    assignedVendorAuthUserId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    assignedStaff: {
      type: [projectAssignmentSchema],
      default: [],
    },
    dueDate: {
      type: Date,
      default: null,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    coverImageUrl: {
      type: String,
      default: "",
    },
    checklist: {
      type: [projectChecklistSchema],
      default: [],
    },
    attchments: {
      type: [String],
      default: [],
    },
    attachments: {
      type: [String],
      default: [],
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    notes: {
      type: [projectNoteSchema],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Project", projectSchema);
