const repo = require("../repositories/notification.repository");

const getUserNotifications = (userId) => repo.getNotifications(userId);

const markNotificationRead = (id) => repo.markAsRead(id);

const markAllRead = (userId) => repo.markAllAsRead(userId);

const getUnreadCount = (userId) => repo.countUnread(userId);

const clearAllNotifications = (userId) => repo.clearAllNotifications(userId);

module.exports = {
  getUserNotifications,
  markNotificationRead,
  markAllRead,
  getUnreadCount,
  clearAllNotifications,
};
