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
      url: `${SERVICES.PROJECT}/services`,
      params: req.query,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(200).json(data);
  }),
);

router.get(
  "/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "get",
      url: `${SERVICES.PROJECT}/services/${req.params.id}`,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(200).json(data);
  }),
);

router.post(
  "/",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "post",
      url: `${SERVICES.PROJECT}/services`,
      data: req.body,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(201).json(data);
  }),
);

router.put(
  "/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "put",
      url: `${SERVICES.PROJECT}/services/${req.params.id}`,
      data: req.body,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(200).json(data);
  }),
);

module.exports = router;
