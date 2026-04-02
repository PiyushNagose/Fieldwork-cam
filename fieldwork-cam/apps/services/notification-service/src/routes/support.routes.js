const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const supportController = require("../controllers/support.controller");

const router = express.Router();

router.get("/", authMiddleware, supportController.getTickets);
router.post("/", authMiddleware, supportController.createTicket);

module.exports = router;
