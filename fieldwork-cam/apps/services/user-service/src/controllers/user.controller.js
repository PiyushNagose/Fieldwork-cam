const { asyncHandler } = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");
const userService = require("../services/user.service");

const getProfile = asyncHandler(async (req, res) => {
  const authUserId = req.user.userId;

  if (!authUserId) {
    throw new ApiError("Unauthorized", 401);
  }

  const profile = await userService.getProfile(req.user);

  return successResponse(res, profile, "Profile fetched successfully", 200);
});

const updateProfile = asyncHandler(async (req, res) => {
  const authUserId = req.user.userId;

  if (!authUserId) {
    throw new ApiError("Unauthorized", 401);
  }

  const profile = await userService.updateProfile(req.user, req.body);

  return successResponse(res, profile, "Profile updated successfully", 200);
});

module.exports = {
  getProfile,
  updateProfile,
};
