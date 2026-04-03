const { asyncHandler } = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const aiService = require("../services/ai.service");

const verifyPhoto = asyncHandler(async (req, res) => {
  const data = await aiService.verifyPhotoService(
    req.params.photoId,
    req.headers.authorization,
  );

  return successResponse(res, data, "Photo verified successfully", 200);
});

const verifyProject = asyncHandler(async (req, res) => {
  const data = await aiService.verifyProjectPhotosService(
    req.params.projectId,
    req.headers.authorization,
  );

  return successResponse(
    res,
    data,
    "Project photos verified successfully",
    200,
  );
});

const verifyBatch = asyncHandler(async (req, res) => {
  const data = await aiService.verifyPhotoBatchService(
    req.body.photoIds,
    req.headers.authorization,
  );

  return successResponse(res, data, "Selected photos verified successfully", 200);
});

module.exports = {
  verifyPhoto,
  verifyProject,
  verifyBatch,
};
