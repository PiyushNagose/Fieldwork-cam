const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const validateMiddleware = require("../middlewares/validate.middleware");
const upload = require("../middlewares/upload.middleware");
const mediaController = require("../controllers/media.controller");
const { uploadPhotoValidator } = require("../validators/media.validator");

const router = express.Router();

router.post(
  "/upload",
  authMiddleware,
  upload.single("photo"),
  uploadPhotoValidator,
  validateMiddleware,
  mediaController.uploadPhoto,
);

router.get(
  "/project/:projectId",
  authMiddleware,
  mediaController.getProjectPhotos,
);

router.get(
  "/project/:projectId/category/:category",
  authMiddleware,
  mediaController.getProjectPhotosByCategory,
);

router.delete("/:photoId", authMiddleware, mediaController.deletePhoto);

router.patch(
  "/:photoId/retake",
  authMiddleware,
  upload.single("photo"),
  mediaController.retakePhoto,
);

router.get(
  "/internal/media/:photoId",
  authMiddleware,
  mediaController.getPhotoInternal,
);

router.patch(
  "/internal/media/:photoId/ai-result",
  authMiddleware,
  mediaController.patchPhotoAIResult,
);

module.exports = router;
