const express = require("express");
const { SERVICES } = require("../config/services");
const { forwardRequest } = require("../services/proxy.service");
const { asyncHandler } = require("../utils/asyncHandler");
const authMiddleware = require("../middlewares/auth.middleware");
const httpClient = require("../utils/httpClient");

const router = express.Router();

router.get(
  "/uploads/:folder/:fileName",
  asyncHandler(async (req, res) => {
    const upstreamResponse = await httpClient.get(
      `${SERVICES.PROJECT}/uploads/${req.params.folder}/${req.params.fileName}`,
      {
        responseType: "stream",
      },
    );

    if (upstreamResponse.headers["content-type"]) {
      res.setHeader("content-type", upstreamResponse.headers["content-type"]);
    }

    upstreamResponse.data.pipe(res);
  }),
);

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
      data: {
        ...req.body,
        publicBaseUrl: `${req.protocol}://${req.get("host")}/api`,
      },
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
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "post",
      url: `${SERVICES.PROJECT}/projects/${req.params.projectId}/assign-staff`,
      data: req.body,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(200).json(data);
  }),
);

router.delete(
  "/:projectId/assign-staff/:staffId",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "delete",
      url: `${SERVICES.PROJECT}/projects/${req.params.projectId}/assign-staff/${req.params.staffId}`,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(200).json(data);
  }),
);

router.put(
  "/:projectId",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "put",
      url: `${SERVICES.PROJECT}/projects/${req.params.projectId}`,
      data: {
        ...req.body,
        publicBaseUrl: `${req.protocol}://${req.get("host")}/api`,
      },
      headers: {
        authorization: req.headers.authorization,
      },
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

router.delete(
  "/:projectId",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "delete",
      url: `${SERVICES.PROJECT}/projects/${req.params.projectId}`,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(200).json(data);
  }),
);

module.exports = router;
