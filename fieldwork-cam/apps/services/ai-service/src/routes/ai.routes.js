const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const aiController = require("../controllers/ai.controller");

const router = express.Router();

router.post("/verify/:photoId", authMiddleware, aiController.verifyPhoto);
router.post(
  "/verify-project/:projectId",
  authMiddleware,
  aiController.verifyProject,
);

module.exports = router;
