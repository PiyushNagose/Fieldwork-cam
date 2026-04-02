const { body } = require("express-validator");

const serviceValidator = [
  body("category").notEmpty().withMessage("Category is required"),
  body("name").notEmpty().withMessage("Service name is required"),
  body("defaultPrice")
    .optional()
    .isNumeric()
    .withMessage("Default price must be numeric"),

  body("photoChecklist")
    .optional()
    .isArray()
    .withMessage("Photo checklist must be an array"),

  body("photoChecklist.*.title")
    .optional()
    .notEmpty()
    .withMessage("Photo requirement title is required"),

  body("photoChecklist.*.required")
    .optional()
    .isBoolean()
    .withMessage("Photo requirement required must be boolean"),

  body("photoChecklist.*.captureType")
    .optional()
    .isIn(["WIDE_ANGLE", "CLOSE_UP", "HIGH_DETAIL", "STANDARD"])
    .withMessage("Invalid capture type"),

  body("status")
    .optional()
    .isIn(["ACTIVE", "INACTIVE"])
    .withMessage("Invalid status"),
];

module.exports = {
  serviceValidator,
};