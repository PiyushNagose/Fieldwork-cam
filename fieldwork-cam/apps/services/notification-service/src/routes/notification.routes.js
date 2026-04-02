const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const controller = require("../controllers/notification.controller");

const router = express.Router();

router.get("/", authMiddleware, controller.getNotifications);
router.patch("/:id/read", authMiddleware, controller.markRead);
router.patch("/read-all", authMiddleware, controller.markAllRead);
router.get("/unread-count", authMiddleware, controller.unreadCount);

module.exports = router;