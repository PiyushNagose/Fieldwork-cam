const { asyncHandler } = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const service = require("../services/notification.service");

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

module.exports = {
  getNotifications,
  markRead,
  markAllRead,
  unreadCount,
};
