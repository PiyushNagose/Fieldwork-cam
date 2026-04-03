const { asyncHandler } = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const service = require("../services/notification.service");

const createInternal = asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body?.notifications)
    ? req.body.notifications
    : req.body
      ? [req.body]
      : [];
  const data = await service.createInternalNotifications(items);
  return successResponse(res, data, "Notifications created", 201);
});

const getNotifications = asyncHandler(async (req, res) => {
  const data = await service.getUserNotifications(req.user.userId);
  return successResponse(res, data);
});

const markRead = asyncHandler(async (req, res) => {
  const data = await service.markNotificationRead(req.params.id);
  return successResponse(res, data);
});

const markAllRead = asyncHandler(async (req, res) => {
  await service.markAllRead(req.user.userId);
  return successResponse(res, null, "All marked as read");
});

const unreadCount = asyncHandler(async (req, res) => {
  const count = await service.getUnreadCount(req.user.userId);
  return successResponse(res, { count });
});

const clearAll = asyncHandler(async (req, res) => {
  await service.clearAllNotifications(req.user.userId);
  return successResponse(res, null, "All notifications cleared");
});

module.exports = {
  createInternal,
  getNotifications,
  markRead,
  markAllRead,
  unreadCount,
  clearAll,
};
