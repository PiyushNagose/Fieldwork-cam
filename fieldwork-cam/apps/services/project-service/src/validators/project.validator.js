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
  body("coverImageUrl").optional().isString(),
  body("coverImageDataUrl").optional().isString(),
];

const updateProjectValidator = [
  body("workOrderNumber").optional().isString(),
  body("title").optional().isString(),
  body("address").optional().isString(),
  body("serviceType").optional().isString(),
  body("serviceId").optional().isString(),
  body("clientName").optional().isString(),
  body("assignedVendorAuthUserId").optional().isString(),
  body("dueDate").optional({ nullable: true }).isISO8601(),
  body("description").optional().isString(),
  body("priority")
    .optional()
    .isIn(["Low", "Medium", "High", "Urgent"])
    .withMessage("Invalid priority"),
  body("status")
    .optional()
    .isIn([
      "New",
      "In Progress",
      "Submitted",
      "Approved",
      "Completed",
      "Rejected",
      "Retake Requested",
    ])
    .withMessage("Invalid project status"),
  body("checklist").optional().isArray(),
  body("attachments").optional().isArray(),
  body("coverImageUrl").optional().isString(),
  body("coverImageDataUrl").optional().isString(),
  body("latitude").optional({ nullable: true }).isFloat(),
  body("longitude").optional({ nullable: true }).isFloat(),
];

const updateProjectStatusValidator = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn([
      "New",
      "In Progress",
      "Submitted",
      "Approved",
      "Completed",
      "Rejected",
      "Retake Requested",
    ])
    .withMessage("Invalid project status"),
];

module.exports = {
  createProjectValidator,
  updateProjectValidator,
  updateProjectStatusValidator,
};
