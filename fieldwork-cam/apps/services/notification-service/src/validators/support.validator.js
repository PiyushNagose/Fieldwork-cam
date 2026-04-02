const { body } = require("express-validator");

const createSupportTicketValidator = [
  body("title").notEmpty().withMessage("Title is required"),
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
