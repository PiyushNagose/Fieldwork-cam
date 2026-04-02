const express = require("express");
const { SERVICES } = require("../config/services");
const { forwardRequest } = require("../services/proxy.service");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

// 🔐 Login with phone
router.post(
  "/login-phone",
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "post",
      url: `${SERVICES.AUTH}/auth/login-phone`,
      data: req.body,
    });

    res.status(200).json(data);
  }),
);

// 🔐 Login with email (web)
router.post(
  "/login-email",
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "post",
      url: `${SERVICES.AUTH}/auth/login-email`,
      data: req.body,
    });

    res.status(200).json(data);
  }),
);

// 📲 Send OTP
router.post(
  "/send-otp",
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "post",
      url: `${SERVICES.AUTH}/auth/send-otp`,
      data: req.body,
    });

    res.status(200).json(data);
  }),
);

// 🔑 Verify OTP
router.post(
  "/verify-otp",
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "post",
      url: `${SERVICES.AUTH}/auth/verify-otp`,
      data: req.body,
    });

    res.status(200).json(data);
  }),
);

router.post(
  "/accept-invite",
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "post",
      url: `${SERVICES.AUTH}/auth/accept-invite`,
      data: req.body,
    });

    res.status(200).json(data);
  }),
);

module.exports = router;
