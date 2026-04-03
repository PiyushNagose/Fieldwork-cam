const { body } = require("express-validator");

const createSupportTicketValidator = [
  body("title")
    .custom((value, { req }) => {
      const nextTitle = String(value || req.body?.subject || "").trim();
      if (!nextTitle) {
        throw new Error("Title is required");
      }
      return true;
    }),
  body("description").notEmpty().withMessage("Description is required"),
  body("category")
    .isIn([
      "TECHNICAL_ISSUE",
      "BILLING",
      "ACCOUNT",
      "FEATURE_REQUEST",
      "GENERAL",
    ])
    .withMessage("Valid category is required"),
  body("priority")
    .optional()
    .isIn(["LOW", "MEDIUM", "HIGH"])
    .withMessage("Priority must be LOW, MEDIUM or HIGH"),
];

module.exports = {
  createSupportTicketValidator,
};
