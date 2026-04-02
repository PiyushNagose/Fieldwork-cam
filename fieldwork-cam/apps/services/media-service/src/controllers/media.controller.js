const { asyncHandler } = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const mediaService = require("../services/media.service");
const {
  getPhotoById,
  updatePhotoById,
} = require("../repositories/media.repository");

const uploadPhoto = asyncHandler(async (req, res) => {
  const data = await mediaService.uploadPhotoService(
    req.user.userId,
    req.file,
    req.body,
  );
  return successResponse(res, data, "Photo uploaded successfully", 201);
});

const getProjectPhotos = asyncHandler(async (req, res) => {
  const data = await mediaService.getProjectPhotosService(req.params.projectId);
  return successResponse(res, data, "Project photos fetched successfully", 200);
});

const getProjectPhotosByCategory = asyncHandler(async (req, res) => {
  const data = await mediaService.getProjectPhotosByCategoryService(
    req.params.projectId,
    req.params.category,
  );
  return successResponse(
    res,
    data,
    "Project category photos fetched successfully",
    200,
  );
});

const deletePhoto = asyncHandler(async (req, res) => {
  await mediaService.deletePhotoService(req.params.photoId);
  return successResponse(res, null, "Photo deleted successfully", 200);
});

const retakePhoto = asyncHandler(async (req, res) => {
  const data = await mediaService.retakePhotoService(
    req.params.photoId,
    req.file,
  );
  return successResponse(res, data, "Photo retaken successfully", 200);
});

const getPhotoInternal = asyncHandler(async (req, res) => {
  const data = await getPhotoById(req.params.photoId);
  return successResponse(res, data, "Photo fetched successfully", 200);
});

const patchPhotoAIResult = asyncHandler(async (req, res) => {
  const data = await updatePhotoById(req.params.photoId, {
    aiStatus: req.body.aiStatus,
    aiScore: req.body.aiScore,
    aiChecks: req.body.aiChecks,
  });

  return successResponse(res, data, "AI result updated successfully", 200);
});

module.exports = {
  uploadPhoto,
  getProjectPhotos,
  getProjectPhotosByCategory,
  deletePhoto,
  retakePhoto,
  getPhotoInternal,
  patchPhotoAIResult,
};
