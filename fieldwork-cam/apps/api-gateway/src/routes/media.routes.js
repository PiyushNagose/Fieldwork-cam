const express = require("express");
const multer = require("multer");
const { SERVICES } = require("../config/services");
const { forwardRequest } = require("../services/proxy.service");
const { asyncHandler } = require("../utils/asyncHandler");
const authMiddleware = require("../middlewares/auth.middleware");
const FormData = require("form-data");
const fs = require("fs");

const router = express.Router();
const upload = multer({ dest: "temp-uploads/" });

router.post(
  "/upload",
  authMiddleware,
  upload.single("photo"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Photo file is required",
      });
    }

    const form = new FormData();
    form.append(
      "photo",
      fs.createReadStream(req.file.path),
      {
        filename: req.file.originalname || req.file.filename || "upload.jpg",
        contentType: req.file.mimetype || "image/jpeg",
      },
    );

    Object.keys(req.body || {}).forEach((key) => {
      if (req.body[key] !== undefined && req.body[key] !== null) {
        form.append(key, String(req.body[key]));
      }
    });

    try {
      const data = await forwardRequest({
        method: "post",
        url: `${SERVICES.MEDIA}/media/upload`,
        data: form,
        headers: {
          ...form.getHeaders(),
          authorization: req.headers.authorization,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      res.status(201).json(data);
    } finally {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }
  }),
);

router.get(
  "/project/:projectId",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "get",
      url: `${SERVICES.MEDIA}/media/project/${req.params.projectId}`,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(200).json(data);
  }),
);

router.get(
  "/project/:projectId/category/:category",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "get",
      url: `${SERVICES.MEDIA}/media/project/${req.params.projectId}/category/${req.params.category}`,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(200).json(data);
  }),
);

router.delete(
  "/:photoId",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "delete",
      url: `${SERVICES.MEDIA}/media/${req.params.photoId}`,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(200).json(data);
  }),
);

router.patch(
  "/:photoId/retake",
  authMiddleware,
  upload.single("photo"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Photo file is required",
      });
    }

    const form = new FormData();
    form.append(
      "photo",
      fs.createReadStream(req.file.path),
      {
        filename: req.file.originalname || req.file.filename || "upload.jpg",
        contentType: req.file.mimetype || "image/jpeg",
      },
    );

    try {
      const data = await forwardRequest({
        method: "patch",
        url: `${SERVICES.MEDIA}/media/${req.params.photoId}/retake`,
        data: form,
        headers: {
          ...form.getHeaders(),
          authorization: req.headers.authorization,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      res.status(200).json(data);
    } finally {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }
  }),
);

module.exports = router;
