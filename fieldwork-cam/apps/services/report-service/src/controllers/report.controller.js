const { asyncHandler } = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const reportService = require("../services/report.service");

const getReports = asyncHandler(async (req, res) => {
  const data = await reportService.getReportsService(req.user.userId);
  return successResponse(res, data, "Reports fetched successfully", 200);
});

const getReportByProject = asyncHandler(async (req, res) => {
  const data = await reportService.getReportByProjectService(
    req.params.projectId,
    req.headers.authorization,
    req.user.userId
  );

  return successResponse(res, data, "Report fetched successfully", 200);
});

module.exports = {
  getReports,
  getReportByProject,
};