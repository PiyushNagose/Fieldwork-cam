const express = require("express");
const { SERVICES } = require("../config/services");
const { forwardRequest } = require("../services/proxy.service");
const { asyncHandler } = require("../utils/asyncHandler");
const authMiddleware = require("../middlewares/auth.middleware");
const httpClient = require("../utils/httpClient");

const router = express.Router();

const getPublicBaseUrl = (req) => {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const forwardedHost = req.headers["x-forwarded-host"];
  const protocol = forwardedProto || req.protocol;
  const host = forwardedHost || req.get("host");

  return `${protocol}://${host}/api`;
};

router.get(
  "/uploads/:folder/:fileName",
  asyncHandler(async (req, res) => {
    const upstreamResponse = await httpClient.get(
      `${SERVICES.USER}/uploads/${req.params.folder}/${req.params.fileName}`,
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
      data: {
        ...req.body,
        publicBaseUrl: getPublicBaseUrl(req),
      },
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(200).json(data);
  }),
);

module.exports = router;
