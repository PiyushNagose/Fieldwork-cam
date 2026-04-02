const express = require("express");
const { SERVICES } = require("../config/services");
const { forwardRequest } = require("../services/proxy.service");
const { asyncHandler } = require("../utils/asyncHandler");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "post",
      url: `${SERVICES.SUBMISSION}/submissions/create`,
      data: req.body,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(201).json(data);
  })
);

router.get(
  "/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "get",
      url: `${SERVICES.SUBMISSION}/submissions/${req.params.id}`,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(200).json(data);
  })
);

router.get(
  "/project/:projectId",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "get",
      url: `${SERVICES.SUBMISSION}/submissions/project/${req.params.projectId}`,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(200).json(data);
  })
);

router.patch(
  "/:id/review",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "patch",
      url: `${SERVICES.SUBMISSION}/submissions/${req.params.id}/review`,
      data: req.body,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(200).json(data);
  })
);

router.patch(
  "/:id/request-retake",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "patch",
      url: `${SERVICES.SUBMISSION}/submissions/${req.params.id}/request-retake`,
      data: req.body,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(200).json(data);
  })
);

module.exports = router;