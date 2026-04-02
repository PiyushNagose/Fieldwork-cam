const { asyncHandler } = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");
const authService = require("../services/auth.service");

// send otp
const login = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    throw new ApiError("Phone is required", 400);
  }

  const result = await authService.login(phone);

  return successResponse(res, result, "OTP sent successfully", 200);
});

// mobile login
const loginPhone = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    throw new ApiError("Phone and password are required", 400);
  }

  const result = await authService.loginWithPhone({ phone, password });

  return successResponse(res, result, "Login successful", 200);
});

// web login
const loginEmail = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError("Email and password are required", 400);
  }

  const result = await authService.loginWithEmail({ email, password });

  return successResponse(res, result, "Login successful", 200);
});

// otp verify + set password
const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp, password, role } = req.body;

  if (!phone || !otp || !password) {
    throw new ApiError("Phone, OTP and password are required", 400);
  }

  const result = await authService.verifyOtp({
    phone,
    otp,
    password,
    role,
  });

  return successResponse(res, result, "OTP verified successfully", 200);
});

const inviteUser = asyncHandler(async (req, res) => {
  const { phone, email, role } = req.body;

  if (!phone || !role) {
    throw new ApiError("Phone and role are required", 400);
  }

  const result = await authService.inviteUser({
    phone,
    email,
    role,
  });

  return successResponse(res, result, "User invited successfully", 201);
});

const acceptInvite = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    throw new ApiError("Invite token and password are required", 400);
  }

  const result = await authService.acceptInvite({
    token,
    password,
  });

  return successResponse(res, result, "Invite accepted successfully", 200);
});

module.exports = {
  login,
  loginPhone,
  loginEmail,
  verifyOtp,
  inviteUser,
  acceptInvite,
};