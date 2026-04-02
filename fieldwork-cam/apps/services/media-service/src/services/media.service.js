const path = require("path");
const fs = require("fs");
const env = require("../config/env");
const ApiError = require("../utils/apiError");
const {
  createPhoto,
  getProjectPhotos,
  getProjectPhotosByCategory,
  getPhotoById,
  deletePhotoById,
  updatePhotoById,
} = require("../repositories/media.repository");

const buildFileUrl = (fileName) => {
  return `${env.BASE_URL}/${env.UPLOAD_DIR}/${fileName}`;
};

const uploadPhotoService = async (authUserId, file, body) => {
  if (!file) {
    throw new ApiError("Photo file is required", 400);
  }

  const photo = await createPhoto({
    projectId: body.projectId,
    uploadedByAuthUserId: authUserId,
    category: body.category,
    originalName: file.originalname,
    fileName: file.filename,
    mimeType: file.mimetype,
    fileSize: file.size,
    fileUrl: buildFileUrl(file.filename),
    gpsLatitude: body.gpsLatitude ? Number(body.gpsLatitude) : null,
    gpsLongitude: body.gpsLongitude ? Number(body.gpsLongitude) : null,
    timestampCaptured: body.timestampCaptured || null,
    workOrderNumber: body.workOrderNumber || "",
    notes: body.notes || "",
  });

  return photo;
};

const getProjectPhotosService = async (projectId) => {
  return getProjectPhotos(projectId);
};

const getProjectPhotosByCategoryService = async (projectId, category) => {
  return getProjectPhotosByCategory(projectId, category);
};

const deletePhotoService = async (photoId) => {
  const photo = await getPhotoById(photoId);

  if (!photo) {
    throw new ApiError("Photo not found", 404);
  }

  const filePath = path.join(process.cwd(), env.UPLOAD_DIR, photo.fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await deletePhotoById(photoId);
  return true;
};

const retakePhotoService = async (photoId, file) => {
  const oldPhoto = await getPhotoById(photoId);

  if (!oldPhoto) {
    throw new ApiError("Photo not found", 404);
  }

  const oldPath = path.join(process.cwd(), env.UPLOAD_DIR, oldPhoto.fileName);
  if (fs.existsSync(oldPath)) {
    fs.unlinkSync(oldPath);
  }

  return updatePhotoById(photoId, {
    originalName: file.originalname,
    fileName: file.filename,
    mimeType: file.mimetype,
    fileSize: file.size,
    fileUrl: buildFileUrl(file.filename),
    aiStatus: "Pending",
    aiScore: 0,
    aiChecks: {
      clarity: false,
      lighting: false,
      subjectCoverage: false,
      gpsVerification: false,
      timestampValid: false,
    },
  });
};

module.exports = {
  uploadPhotoService,
  getProjectPhotosService,
  getProjectPhotosByCategoryService,
  deletePhotoService,
  retakePhotoService,
};
