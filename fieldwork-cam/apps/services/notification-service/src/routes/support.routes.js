const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const validateMiddleware = require("../middlewares/validate.middleware");
const supportController = require("../controllers/support.controller");
const {
  createSupportTicketValidator,
} = require("../validators/support.validator");

const router = express.Router();

router.get("/", authMiddleware, supportController.getTickets);
router.post(
  "/",
  authMiddleware,
  createSupportTicketValidator,
  validateMiddleware,
  supportController.createTicket,
);

module.exports = router;
