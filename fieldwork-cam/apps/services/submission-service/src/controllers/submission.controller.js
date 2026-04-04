const { asyncHandler } = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const submissionService = require("../services/submission.service");

const createSubmission = asyncHandler(async (req, res) => {
  const data = await submissionService.createSubmissionService(
    req.user,
    req.body,
    req.headers.authorization
  );

  return successResponse(res, data, "Submission created successfully", 201);
});

const getSubmissionById = asyncHandler(async (req, res) => {
  const data = await submissionService.getSubmissionByIdService(req.params.id);
  return successResponse(res, data, "Submission fetched successfully", 200);
});

const getSubmissionByProject = asyncHandler(async (req, res) => {
  const data = await submissionService.getSubmissionByProjectService(
    req.params.projectId
  );
  return successResponse(res, data, "Submission fetched successfully", 200);
});

const reviewSubmission = asyncHandler(async (req, res) => {
  const data = await submissionService.reviewSubmissionService(
    req.user.userId,
    req.params.id,
    req.body,
    req.headers.authorization
  );

  return successResponse(res, data, "Submission reviewed successfully", 200);
});

const requestRetake = asyncHandler(async (req, res) => {
  const data = await submissionService.requestRetakeService(
    req.user.userId,
    req.params.id,
    req.body,
    req.headers.authorization
  );

  return successResponse(res, data, "Retake requested successfully", 200);
});

module.exports = {
  createSubmission,
  getSubmissionById,
  getSubmissionByProject,
  reviewSubmission,
  requestRetake,
};
