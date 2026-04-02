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
      url: `${SERVICES.USER}/vendors`,
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
      url: `${SERVICES.USER}/vendors/${req.params.id}`,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(200).json(data);
  }),
);

router.post(
  "/admin/create",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const inviteResponse = await forwardRequest({
      method: "post",
      url: `${SERVICES.AUTH}/auth/invite-user`,
      data: {
        phone: req.body.phone,
        email: req.body.email,
        role: "VENDOR_OWNER",
      },
      headers: {
        authorization: req.headers.authorization,
      },
    });

    const inviteData = inviteResponse?.data || inviteResponse;
    const authUserId = inviteData?.authUser?._id || inviteData?.authUser?.id;

    if (!authUserId) {
      throw new Error("Failed to create auth invite user");
    }

    const vendorResponse = await forwardRequest({
      method: "post",
      url: `${SERVICES.USER}/vendors/admin/create`,
      data: {
        ...req.body,
        authUserId,
      },
      headers: {
        authorization: req.headers.authorization,
      },
    });

    const vendorData = vendorResponse?.data || vendorResponse;

    res.status(201).json({
      success: true,
      message: "Vendor created and invited successfully",
      data: {
        ...vendorData,
        inviteToken: inviteData?.inviteToken || "",
        inviteLink: inviteData?.inviteLink || "",
      },
    });
  }),
);

router.get(
  "/me/profile",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const data = await forwardRequest({
      method: "get",
      url: `${SERVICES.USER}/vendors/me/profile`,
      headers: {
        authorization: req.headers.authorization,
      },
    });

    res.status(200).json(data);
  }),
);

module.exports = router;
