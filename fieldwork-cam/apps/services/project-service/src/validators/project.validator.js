const { body } = require("express-validator");

const createProjectValidator = [
  body("workOrderNumber")
    .notEmpty()
    .withMessage("Work order number is required"),
  body("title").notEmpty().withMessage("Project title is required"),
  body("address").notEmpty().withMessage("Address is required"),
  body("assignedVendorAuthUserId")
    .notEmpty()
    .withMessage("Assigned vendor auth user id is required"),
];

module.exports = {
  createProjectValidator,
};
