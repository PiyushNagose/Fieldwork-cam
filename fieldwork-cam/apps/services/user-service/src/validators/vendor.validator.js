const { body } = require("express-validator");

const createVendorProfileValidator = [
  body("fullName").notEmpty().withMessage("Full name is required"),
  body("companyName").notEmpty().withMessage("Company name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("phone").notEmpty().withMessage("Phone is required"),
  body("serviceArea").notEmpty().withMessage("Service area is required"),
  body("authUserId")
    .optional()
    .isString()
    .withMessage("Auth user id must be string"),
  body("serviceTypes")
    .optional()
    .isArray()
    .withMessage("Service types must be an array"),
  body("address").optional().isString(),
  body("taxId").optional().isString(),
  body("identityDocumentUrl").optional().isString(),
];

module.exports = {
  createVendorProfileValidator,
};
