const express = require("express");
const { SERVICES } = require("../config/services");
const { forwardRequest } = require("../services/proxy.service");
const { asyncHandler } = require("../utils/asyncHandler");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "get",
      url: `${SERVICES.PROJECT}/projects`,
      params: req.query,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(200).json(data);
  }),
);

router.get(
  "/:projectId",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "get",
      url: `${SERVICES.PROJECT}/projects/${req.params.projectId}`,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(200).json(data);
  }),
);

router.post(
  "/create",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "post",
      url: `${SERVICES.PROJECT}/projects/create`,
      data: req.body,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(201).json(data);
  }),
);

router.get(
  "/:projectId/notes",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "get",
      url: `${SERVICES.PROJECT}/projects/${req.params.projectId}/notes`,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(200).json(data);
  }),
);

router.post(
  "/:projectId/notes",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "post",
      url: `${SERVICES.PROJECT}/projects/${req.params.projectId}/notes`,
      data: req.body,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(201).json(data);
  }),
);

router.post(
  "/:projectId/assign-vendor",
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "post",
      url: `${SERVICES.PROJECT}/projects/${req.params.projectId}/assign-vendor`,
      data: req.body,
    });

    res.status(200).json(data);
  }),
);

router.post(
  "/:projectId/assign-staff",
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "post",
      url: `${SERVICES.PROJECT}/projects/${req.params.projectId}/assign-staff`,
      data: req.body,
    });

    res.status(200).json(data);
  }),
);

router.patch(
  "/:projectId/status",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "patch",
      url: `${SERVICES.PROJECT}/projects/${req.params.projectId}/status`,
      data: req.body,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(200).json(data);
  }),
);

module.exports = router;
