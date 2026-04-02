const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const validateMiddleware = require("../middlewares/validate.middleware");
const vendorController = require("../controllers/vendor.controller");
const {
  createVendorProfileValidator,
} = require("../validators/vendor.validator");

const router = express.Router();

router.get("/", authMiddleware, vendorController.getVendors);
router.get("/:id", authMiddleware, vendorController.getVendorById);
router.get(
  "/me/profile",
  authMiddleware,
  vendorController.getVendorProfileByAuthUserId,
);

router.post(
  "/admin/create",
  authMiddleware,
  createVendorProfileValidator,
  validateMiddleware,
  vendorController.createVendorByAdmin,
);

module.exports = router;
