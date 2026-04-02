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
      url: `${SERVICES.REPORT}/performance`,
      headers: { authorization: req.headers.authorization },
    });

    res.status(200).json(data);
  }),
);

module.exports = router;
