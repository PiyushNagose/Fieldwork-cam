const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const validateMiddleware = require("../middlewares/validate.middleware");
const projectController = require("../controllers/project.controller");
const {
  createProjectValidator,
  updateProjectStatusValidator,
} = require("../validators/project.validator");
const { addProjectNoteValidator } = require("../validators/note.validator");
const {
  assignVendorValidator,
  assignStaffValidator,
} = require("../validators/assignment.validator");

const router = express.Router();

router.get("/", authMiddleware, projectController.getProjects);

router.get("/:projectId", authMiddleware, projectController.getProjectById);

router.post(
  "/create",
  authMiddleware,
  createProjectValidator,
  validateMiddleware,
  projectController.createProject,
);

router.get(
  "/:projectId/notes",
  authMiddleware,
  projectController.getProjectNotes,
);

router.post(
  "/:projectId/notes",
  authMiddleware,
  addProjectNoteValidator,
  validateMiddleware,
  projectController.addProjectNote,
);

router.post(
  "/:projectId/assign-vendor",
  assignVendorValidator,
  validateMiddleware,
  projectController.assignVendor,
);

router.post(
  "/:projectId/assign-staff",
  assignStaffValidator,
  validateMiddleware,
  projectController.assignStaff,
);

router.patch(
  "/:projectId/status",
  authMiddleware,
  updateProjectStatusValidator,
  validateMiddleware,
  projectController.updateProjectStatus,
);

module.exports = router;
