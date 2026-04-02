const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const validateMiddleware = require("../middlewares/validate.middleware");
const vendorController = require("../controllers/vendor.controller");
const {
  createVendorProfileValidator,
  updateVendorProfileValidator,
} = require("../validators/vendor.validator");

const router = express.Router();

router.get("/", authMiddleware, vendorController.getVendors);
router.get(
  "/me/profile",
  authMiddleware,
  vendorController.getVendorProfileByAuthUserId,
);
router.put(
  "/me/profile",
  authMiddleware,
  updateVendorProfileValidator,
  validateMiddleware,
  vendorController.updateVendorProfile,
);
router.get("/:id", authMiddleware, vendorController.getVendorById);

router.post(
  "/admin/create",
  authMiddleware,
  createVendorProfileValidator,
  validateMiddleware,
  vendorController.createVendorByAdmin,
);

module.exports = router;
