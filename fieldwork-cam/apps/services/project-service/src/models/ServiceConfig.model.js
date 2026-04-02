const mongoose = require("mongoose");

const photoRequirementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    required: {
      type: Boolean,
      default: true,
    },
    captureType: {
      type: String,
      enum: ["WIDE_ANGLE", "CLOSE_UP", "HIGH_DETAIL", "STANDARD"],
      default: "STANDARD",
    },
  },
  { _id: false },
);

const workflowRulesSchema = new mongoose.Schema(
  {
    serviceLogic: {
      type: String,
      default: "",
      trim: true,
    },
    requireSignatureOnCompletion: {
      type: Boolean,
      default: false,
    },
    autoApproveInvoicesUnder500: {
      type: Boolean,
      default: false,
    },
    notifyClientOnDispatch: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const serviceConfigSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    defaultPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    photoChecklist: {
      type: [photoRequirementSchema],
      default: [],
    },
    workflowRules: {
      type: workflowRulesSchema,
      default: () => ({}),
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ServiceConfig", serviceConfigSchema);
