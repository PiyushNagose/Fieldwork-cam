const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const reportController = require("../controllers/report.controller");

const router = express.Router();

router.get("/", authMiddleware, reportController.getReports);
router.get("/:projectId", authMiddleware, reportController.getReportByProject);

module.exports = router;
