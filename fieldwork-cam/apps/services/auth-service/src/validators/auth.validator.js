const { body } = require("express-validator");

const loginPhoneValidator = [
  body("phone").notEmpty().withMessage("Phone is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const loginEmailValidator = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const sendOtpValidator = [
  body("phone").notEmpty().withMessage("Phone is required"),
];

const verifyOtpValidator = [
  body("phone").notEmpty().withMessage("Phone is required"),
  body("otp").notEmpty().withMessage("OTP is required"),
  body("password").notEmpty().withMessage("Password is required"),
  body("role")
    .optional()
    .isIn(["ADMIN", "VENDOR_OWNER", "STAFF"])
    .withMessage("Invalid role"),
];

const inviteUserValidator = [
  body("phone").notEmpty().withMessage("Phone is required"),
  body("email").optional().isEmail().withMessage("Valid email is required"),
  body("fullName").optional().isString().withMessage("Full name must be string"),
  body("companyName")
    .optional()
    .isString()
    .withMessage("Company name must be string"),
  body("inviteBaseUrl")
    .optional()
    .isString()
    .withMessage("Invite base url must be string"),
  body("role")
    .notEmpty()
    .isIn(["VENDOR_OWNER", "STAFF"])
    .withMessage("Role must be VENDOR_OWNER or STAFF"),
];

const acceptInviteValidator = [
  body("token").notEmpty().withMessage("Invite token is required"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

module.exports = {
  loginPhoneValidator,
  loginEmailValidator,
  verifyOtpValidator,
  sendOtpValidator,
  inviteUserValidator,
  acceptInviteValidator,
};
