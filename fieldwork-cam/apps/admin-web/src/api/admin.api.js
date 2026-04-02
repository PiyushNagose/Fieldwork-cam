import { apiClient } from "./client";

export const getAdminProfileApi = async () => {
  const response = await apiClient.get("/users/profile");
  return response.data;
};

export const updateAdminProfileApi = async (payload) => {
  const response = await apiClient.put("/users/profile", payload);
  return response.data;
};
