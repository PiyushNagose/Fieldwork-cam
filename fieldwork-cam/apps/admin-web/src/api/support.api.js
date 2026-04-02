import { apiClient } from "./client";

export const getTicketsApi = async (params = {}) => {
  const response = await apiClient.get("/support", { params });
  return response.data;
};

export const createTicketApi = async (payload) => {
  const response = await apiClient.post("/support", payload);
  return response.data;
};
