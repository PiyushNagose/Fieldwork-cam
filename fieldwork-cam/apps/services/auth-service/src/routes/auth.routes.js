const express = require("express");
const authController = require("../controllers/auth.controller");
const validateMiddleware = require("../middlewares/validate.middleware");
const {
  loginPhoneValidator,
  loginEmailValidator,
  verifyOtpValidator,
  sendOtpValidator,
  inviteUserValidator,
  acceptInviteValidator,
} = require("../validators/auth.validator");

const router = express.Router();

// password login
router.post(
  "/login-phone",
  loginPhoneValidator,
  validateMiddleware,
  authController.loginPhone,
);

router.post(
  "/login-email",
  loginEmailValidator,
  validateMiddleware,
  authController.loginEmail,
);

// otp flow
router.post(
  "/send-otp",
  sendOtpValidator,
  validateMiddleware,
  authController.login,
);

router.post(
  "/verify-otp",
  verifyOtpValidator,
  validateMiddleware,
  authController.verifyOtp,
);

// invite flow
router.post(
  "/invite-user",
  inviteUserValidator,
  validateMiddleware,
  authController.inviteUser,
);

router.post(
  "/accept-invite",
  acceptInviteValidator,
  validateMiddleware,
  authController.acceptInvite,
);

module.exports = router;
