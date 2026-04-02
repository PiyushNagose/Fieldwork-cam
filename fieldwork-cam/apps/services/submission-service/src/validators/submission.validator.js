const { body } = require("express-validator");

const createSubmissionValidator = [
  body("projectId").notEmpty().withMessage("Project ID is required"),
  body("photoIds").isArray({ min: 1 }).withMessage("At least one photo is required"),
  body("aiAverageScore")
    .optional()
    .isNumeric()
    .withMessage("AI average score must be numeric"),
];

const reviewSubmissionValidator = [
  body("decision")
    .isIn(["Approved", "Rejected"])
    .withMessage("Decision must be Approved or Rejected"),
  body("adminComments").optional().isString(),
];

const requestRetakeValidator = [
  body("adminComments")
    .notEmpty()
    .withMessage("Retake reason is required"),
];

module.exports = {
  createSubmissionValidator,
  reviewSubmissionValidator,
  requestRetakeValidator,
};