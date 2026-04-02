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
  body("website").optional().isString(),
  body("taxId").optional().isString(),
  body("identityDocumentUrl").optional().isString(),
];

const updateVendorProfileValidator = [
  body("fullName").optional().isString().withMessage("Full name must be string"),
  body("email").optional().isEmail().withMessage("Valid email is required"),
  body("phone").optional().isString().withMessage("Phone must be string"),
  body("companyName")
    .optional()
    .isString()
    .withMessage("Company name must be string"),
  body("serviceArea")
    .optional()
    .isString()
    .withMessage("Service area must be string"),
  body("address").optional().isString().withMessage("Address must be string"),
  body("website").optional().isString().withMessage("Website must be string"),
  body("taxId").optional().isString().withMessage("Tax ID must be string"),
  body("identityDocumentUrl")
    .optional()
    .isString()
    .withMessage("Identity document URL must be string"),
  body("jobTitle").optional().isString().withMessage("Job title must be string"),
  body("department")
    .optional()
    .isString()
    .withMessage("Department must be string"),
  body("location").optional().isString().withMessage("Location must be string"),
  body("timezone").optional().isString().withMessage("Timezone must be string"),
  body("bio").optional().isString().withMessage("Bio must be string"),
  body("profilePhotoUrl")
    .optional()
    .isString()
    .withMessage("Profile photo URL must be string"),
  body("serviceTypes")
    .optional()
    .isArray()
    .withMessage("Service types must be an array"),
  body("meta").optional().isObject().withMessage("Meta must be an object"),
];

module.exports = {
  createVendorProfileValidator,
  updateVendorProfileValidator,
};
