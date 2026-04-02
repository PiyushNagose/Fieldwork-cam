import { apiClient } from "./client";

export const getServicesApi = async (params = {}) => {
  const response = await apiClient.get("/services", { params });
  return response.data;
};

export const createServiceApi = async (payload) => {
  const response = await apiClient.post("/services", payload);
  return response.data;
};

export const updateServiceApi = async (id, payload) => {
  const response = await apiClient.put(`/services/${id}`, payload);
  return response.data;
};
