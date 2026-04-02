const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const performanceController = require("../controllers/performance.controller");

const router = express.Router();

router.get("/", authMiddleware, performanceController.getPerformanceSummary);

module.exports = router;