const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const validateMiddleware = require("../middlewares/validate.middleware");
const staffController = require("../controllers/staff.controller");
const {
  createStaffValidator,
  assignProjectValidator,
  updateStaffValidator,
  updateStatusValidator,
} = require("../validators/staff.validator");

const router = express.Router();

router.get("/", authMiddleware, staffController.getTeam);

router.get("/stats", authMiddleware, staffController.getStaffStats);

router.post(
  "/add",
  authMiddleware,
  createStaffValidator,
  validateMiddleware,
  staffController.createStaff,
);

router.get("/:id", authMiddleware, staffController.getStaffDetails);

router.post(
  "/:id/assign-project",
  authMiddleware,
  assignProjectValidator,
  validateMiddleware,
  staffController.assignProject,
);

router.delete(
  "/:id/assign-project/:projectId",
  authMiddleware,
  staffController.unassignProject,
);

router.patch(
  "/:id/status",
  authMiddleware,
  updateStatusValidator,
  validateMiddleware,
  staffController.updateStatus,
);

router.patch(
  "/:id",
  authMiddleware,
  updateStaffValidator,
  validateMiddleware,
  staffController.updateStaff,
);

router.delete("/:id", authMiddleware, staffController.removeStaff);

module.exports = router;
