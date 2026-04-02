const { body } = require("express-validator");

// 🔷 CREATE STAFF
const createStaffValidator = [
  body("fullName").notEmpty().withMessage("Full name is required"),

  body("phone").notEmpty().withMessage("Phone is required"),

  body("email").isEmail().withMessage("Valid email is required"),

  body("roleTitle").notEmpty().withMessage("Role title is required"),

  body("inviteMethod")
    .optional()
    .custom((value) => {
      const v = value.toUpperCase();
      if (!["SMS", "EMAIL"].includes(v)) {
        throw new Error("Invite method must be SMS or Email");
      }
      return true;
    }),

  // 🔷 NEW FIELDS
  body("location").optional().isString(),

  body("profilePhotoUrl").optional().isString(),

  body("specialties").optional().isArray(),

  body("specialties.*").optional().isString(),

  body("status")
    .optional()
    .isIn(["ACTIVE", "INACTIVE", "ON_LEAVE"])
    .withMessage("Invalid status value"),
];

// 🔷 ASSIGN PROJECT
const assignProjectValidator = [
  body("projectId").notEmpty().withMessage("Project ID is required"),
];

// 🔷 UPDATE STATUS (NEW)
const updateStatusValidator = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["ACTIVE", "INACTIVE", "ON_LEAVE"])
    .withMessage("Invalid status value"),
];

module.exports = {
  createStaffValidator,
  assignProjectValidator,
  updateStatusValidator, // NEW
};
