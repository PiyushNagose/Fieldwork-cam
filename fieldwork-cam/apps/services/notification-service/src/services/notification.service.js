const repo = require("../repositories/notification.repository");

const createInternalNotifications = (items = []) => {
  const payloads = (Array.isArray(items) ? items : [])
    .map((item) => ({
      userId: String(item?.userId || "").trim(),
      type: String(item?.type || "SYSTEM").trim().toUpperCase(),
      title: String(item?.title || "").trim(),
      message: String(item?.message || "").trim(),
      isRead: false,
      meta: item?.meta && typeof item.meta === "object" ? item.meta : {},
    }))
    .filter((item) => item.userId && item.title && item.message);

  if (!payloads.length) {
    return [];
  }

  return repo.createNotifications(payloads);
};

const getUserNotifications = (userId) => repo.getNotifications(userId);

const markNotificationRead = (id) => repo.markAsRead(id);

const markAllRead = (userId) => repo.markAllAsRead(userId);

const getUnreadCount = (userId) => repo.countUnread(userId);

const clearAllNotifications = (userId) => repo.clearAllNotifications(userId);

module.exports = {
  createInternalNotifications,
  getUserNotifications,
  markNotificationRead,
  markAllRead,
  getUnreadCount,
  clearAllNotifications,
};
