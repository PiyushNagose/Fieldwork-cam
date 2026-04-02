const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    vendorAuthUserId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["Photo Issue", "Payment", "Project", "Other"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved"],
      default: "Open",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Ticket", ticketSchema);
