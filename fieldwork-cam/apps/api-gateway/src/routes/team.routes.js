const express = require("express");
const env = require("../config/env");
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
      url: `${SERVICES.USER}/team`,
      params: req.query,
      headers: { authorization: req.headers.authorization },
    });

    res.status(200).json(data);
  }),
);

router.get(
  "/stats",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "get",
      url: `${SERVICES.USER}/team/stats`,
      headers: { authorization: req.headers.authorization },
    });

    res.status(200).json(data);
  }),
);

router.post(
  "/add",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "post",
      url: `${SERVICES.USER}/team/add`,
      data: {
        ...req.body,
        inviteBaseUrl: req.headers.origin || env.APP_WEB_URL,
      },
      headers: { authorization: req.headers.authorization },
    });

    res.status(201).json(data);
  }),
);

router.get(
  "/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "get",
      url: `${SERVICES.USER}/team/${req.params.id}`,
      headers: { authorization: req.headers.authorization },
    });

    res.status(200).json(data);
  }),
);

router.post(
  "/:id/assign-project",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "post",
      url: `${SERVICES.USER}/team/${req.params.id}/assign-project`,
      data: req.body,
      headers: { authorization: req.headers.authorization },
    });

    res.status(200).json(data);
  }),
);

router.delete(
  "/:id/assign-project/:projectId",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "delete",
      url: `${SERVICES.USER}/team/${req.params.id}/assign-project/${req.params.projectId}`,
      headers: { authorization: req.headers.authorization },
    });

    res.status(200).json(data);
  }),
);

router.patch(
  "/:id/status",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "patch",
      url: `${SERVICES.USER}/team/${req.params.id}/status`,
      data: req.body,
      headers: { authorization: req.headers.authorization },
    });

    res.status(200).json(data);
  }),
);

router.patch(
  "/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "patch",
      url: `${SERVICES.USER}/team/${req.params.id}`,
      data: req.body,
      headers: { authorization: req.headers.authorization },
    });

    res.status(200).json(data);
  }),
);

router.delete(
  "/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "delete",
      url: `${SERVICES.USER}/team/${req.params.id}`,
      headers: { authorization: req.headers.authorization },
    });

    res.status(200).json(data);
  }),
);

module.exports = router;
