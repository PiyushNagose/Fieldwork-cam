const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    projectId: {
      type: String,
      required: true,
      index: true,
    },

    projectName: {
      type: String,
      default: "",
      trim: true,
    },

    projectCode: {
      type: String,
      default: "",
      trim: true,
    },

    vendorAuthUserId: {
      type: String,
      required: true,
      index: true,
    },

    vendorName: {
      type: String,
      default: "",
      trim: true,
    },

    billToClient: {
      type: String,
      default: "",
      trim: true,
    },

    invoiceDate: {
      type: Date,
      default: Date.now,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    lineItems: [
      {
        description: {
          type: String,
          default: "",
          trim: true,
        },
        qty: {
          type: Number,
          default: 0,
        },
        rate: {
          type: Number,
          default: 0,
        },
        amount: {
          type: Number,
          default: 0,
        },
      },
    ],

    amount: {
      type: Number,
      default: 0,
    },

    subtotal: {
      type: Number,
      default: 0,
    },

    taxPercent: {
      type: Number,
      default: 0,
    },

    taxAmount: {
      type: Number,
      default: 0,
    },

    totalDue: {
      type: Number,
      default: 0,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    paymentDate: {
      type: Date,
      default: null,
    },

    signatureName: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "PAID"],
      default: "PENDING",
    },

    paymentTerms: {
      type: String,
      default: "Net 14",
      trim: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Invoice", invoiceSchema);
