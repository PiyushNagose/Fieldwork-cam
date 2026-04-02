const Notification = require("../models/Notification.model");

const createNotification = (payload) => Notification.create(payload);

const getNotifications = (userId) =>
  Notification.find({ userId }).sort({ createdAt: -1 });

const markAsRead = (id) =>
  Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });

const markAllAsRead = (userId) =>
  Notification.updateMany({ userId }, { isRead: true });

const countUnread = (userId) =>
  Notification.countDocuments({ userId, isRead: false });

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  countUnread,
};
