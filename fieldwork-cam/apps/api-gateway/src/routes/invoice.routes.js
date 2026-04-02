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
      url: `${SERVICES.BILLING}/invoices`,
      params: req.query,
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
      url: `${SERVICES.BILLING}/invoices/create`,
      data: req.body,
      headers: { authorization: req.headers.authorization },
    });

    res.status(201).json(data);
  }),
);

router.get(
  "/project/:projectId",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "get",
      url: `${SERVICES.BILLING}/invoices/project/${req.params.projectId}`,
      headers: { authorization: req.headers.authorization },
    });

    res.status(200).json(data);
  }),
);

router.get(
  "/:invoiceId",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "get",
      url: `${SERVICES.BILLING}/invoices/${req.params.invoiceId}`,
      headers: { authorization: req.headers.authorization },
    });

    res.status(200).json(data);
  }),
);

module.exports = router;
