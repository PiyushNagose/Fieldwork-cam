const { asyncHandler } = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const {
  getPerformanceSummaryService,
} = require("../services/performance.service");

const getPerformanceSummary = asyncHandler(async (req, res) => {
  const data = await getPerformanceSummaryService(req.user.userId);

  return successResponse(
    res,
    data,
    "Performance summary fetched successfully",
    200
  );
});

module.exports = {
  getPerformanceSummary,
};