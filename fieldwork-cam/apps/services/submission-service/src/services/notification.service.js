const env = require("../config/env");

const createNotifications = async (notifications = []) => {
  const payload = (Array.isArray(notifications) ? notifications : []).filter(
    (item) => item?.userId && item?.title && item?.message,
  );

  if (!payload.length) {
    return;
  }

  const response = await fetch(
    `${env.NOTIFICATION_SERVICE_URL}/notifications/internal`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notifications: payload }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to create notifications");
  }
};

module.exports = {
  createNotifications,
};
