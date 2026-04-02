const { asyncHandler } = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");
const dashboardService = require("../services/dashboard.service");

const getDashboard = asyncHandler(async (req, res) => {
  const authUserId = req.user.userId;

  if (!authUserId) {
    throw new ApiError("Unauthorized", 401);
  }

  const dashboardData = await dashboardService.getDashboardData(authUserId);

  return successResponse(
    res,
    dashboardData,
    "Dashboard fetched successfully",
    200,
  );
});

module.exports = {
  getDashboard,
};
