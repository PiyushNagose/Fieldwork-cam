import { apiClient } from "./client";

export const loginEmailApi = async (payload) => {
  const response = await apiClient.post("/auth/login-email", payload);
  return response.data;
};

export const acceptInviteApi = async (payload) => {
  const response = await apiClient.post("/auth/accept-invite", payload);
  return response.data;
}
