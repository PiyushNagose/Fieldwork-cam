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
      url: `${SERVICES.NOTIFICATION}/notifications`,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(200).json(data);
  }),
);

router.patch(
  "/:id/read",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "patch",
      url: `${SERVICES.NOTIFICATION}/notifications/${req.params.id}/read`,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(200).json(data);
  }),
);

router.patch(
  "/read-all",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "patch",
      url: `${SERVICES.NOTIFICATION}/notifications/read-all`,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(200).json(data);
  }),
);

router.delete(
  "/clear-all",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "delete",
      url: `${SERVICES.NOTIFICATION}/notifications/clear-all`,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(200).json(data);
  }),
);

router.get(
  "/unread-count",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "get",
      url: `${SERVICES.NOTIFICATION}/notifications/unread-count`,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(200).json(data);
  }),
);

module.exports = router;
