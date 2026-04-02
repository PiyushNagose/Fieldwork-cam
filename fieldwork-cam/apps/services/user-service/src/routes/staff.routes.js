const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const validateMiddleware = require("../middlewares/validate.middleware");
const staffController = require("../controllers/staff.controller");
const {
  createStaffValidator,
  assignProjectValidator,
  updateStatusValidator,
} = require("../validators/staff.validator");

const router = express.Router();

// 🔷 GET ALL STAFF (with filter + search)
router.get("/", authMiddleware, staffController.getTeam);

// 🔷 STATS (for top cards)
router.get("/stats", authMiddleware, staffController.getStaffStats);

// 🔷 CREATE STAFF
router.post(
  "/add",
  authMiddleware,
  createStaffValidator,
  validateMiddleware,
  staffController.createStaff,
);

// 🔷 GET SINGLE STAFF
router.get("/:id", authMiddleware, staffController.getStaffDetails);

// 🔷 ASSIGN PROJECT
router.post(
  "/:id/assign-project",
  authMiddleware,
  assignProjectValidator,
  validateMiddleware,
  staffController.assignProject,
);

// 🔷 UPDATE STATUS (IMPORTANT)
router.patch(
  "/:id/status",
  authMiddleware,
  updateStatusValidator,
  validateMiddleware,
  staffController.updateStatus,
);

module.exports = router;
