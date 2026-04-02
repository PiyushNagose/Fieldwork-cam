const express = require("express");
const { SERVICES } = require("../config/services");
const { forwardRequest } = require("../services/proxy.service");
const { asyncHandler } = require("../utils/asyncHandler");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// 🔷 GET TEAM (WITH QUERY SUPPORT)
router.get(
  "/",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "get",
      url: `${SERVICES.USER}/team`,
      params: req.query, // ✅ IMPORTANT
      headers: { authorization: req.headers.authorization },
    });

    res.status(200).json(data);
  }),
);

// 🔷 CREATE STAFF
router.post(
  "/add",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "post",
      url: `${SERVICES.USER}/team/add`,
      data: req.body,
      headers: { authorization: req.headers.authorization },
    });

    res.status(201).json(data);
  }),
);

// 🔷 GET STAFF DETAILS
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

// 🔷 ASSIGN PROJECT
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

// 🔷 UPDATE STATUS (NEW)
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

// 🔷 STAFF STATS (NEW)
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

module.exports = router;
