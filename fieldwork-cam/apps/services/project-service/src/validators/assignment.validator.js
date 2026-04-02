const { body } = require("express-validator");

const assignVendorValidator = [
  body("vendorAuthUserId")
    .notEmpty()
    .withMessage("Vendor auth user id is required"),
];

const assignStaffValidator = [
  body("staffId").notEmpty().withMessage("Staff id is required"),
];

module.exports = {
  assignVendorValidator,
  assignStaffValidator,
};
