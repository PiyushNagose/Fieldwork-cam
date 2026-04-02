const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const validateMiddleware = require("../middlewares/validate.middleware");
const submissionController = require("../controllers/submission.controller");
const {
  createSubmissionValidator,
  reviewSubmissionValidator,
  requestRetakeValidator,
} = require("../validators/submission.validator");

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  createSubmissionValidator,
  validateMiddleware,
  submissionController.createSubmission
);

router.get(
  "/:id",
  authMiddleware,
  submissionController.getSubmissionById
);

router.get(
  "/project/:projectId",
  authMiddleware,
  submissionController.getSubmissionByProject
);

router.patch(
  "/:id/review",
  authMiddleware,
  reviewSubmissionValidator,
  validateMiddleware,
  submissionController.reviewSubmission
);

router.patch(
  "/:id/request-retake",
  authMiddleware,
  requestRetakeValidator,
  validateMiddleware,
  submissionController.requestRetake
);

module.exports = router;