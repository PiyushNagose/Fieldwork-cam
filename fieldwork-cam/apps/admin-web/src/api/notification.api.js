import { apiClient } from "./client";

export const getNotificationsApi = async () => {
  const response = await apiClient.get("/notifications");
  return response.data;
};

export const markNotificationReadApi = async (notificationId) => {
  const response = await apiClient.patch(
    `/notifications/${notificationId}/read`,
  );
  return response.data;
};

export const markAllNotificationsReadApi = async () => {
  const response = await apiClient.patch("/notifications/read-all");
  return response.data;
};

export const getUnreadNotificationsCountApi = async () => {
  const response = await apiClient.get("/notifications/unread-count");
  return response.data;
};
