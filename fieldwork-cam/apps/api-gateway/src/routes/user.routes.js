const express = require("express");
const { SERVICES } = require("../config/services");
const { forwardRequest } = require("../services/proxy.service");
const { asyncHandler } = require("../utils/asyncHandler");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.get(
  "/profile",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "get",
      url: `${SERVICES.USER}/users/profile`,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(200).json(data);
  }),
);

router.put(
  "/profile",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "put",
      url: `${SERVICES.USER}/users/profile`,
      data: req.body,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(200).json(data);
  }),
);

module.exports = router;
