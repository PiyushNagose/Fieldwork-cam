const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const ticketController = require("../controllers/ticket.controller");

const router = express.Router();

router.get("/", authMiddleware, ticketController.getTickets);
router.post("/", authMiddleware, ticketController.createTicket);

module.exports = router;
