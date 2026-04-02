import { apiClient } from "./client";

export const getTicketsApi = async (params = {}) => {
  const response = await apiClient.get("/support", { params });
  return response.data;
};
