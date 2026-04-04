import { apiClient } from "./client";

export const getStaffApi = async (params = {}) => {
  const response = await apiClient.get("/team", { params });
  return response.data;
};

export const getStaffStatsApi = async () => {
  const response = await apiClient.get("/team/stats");
  return response.data;
};

export const createStaffApi = async (payload) => {
  const response = await apiClient.post("/team/add", payload);
  return response.data;
};

export const getStaffByIdApi = async (staffId) => {
  const response = await apiClient.get(`/team/${staffId}`);
  return response.data;
};

export const assignProjectToStaffApi = async (staffId, projectId) => {
  const response = await apiClient.post(`/team/${staffId}/assign-project`, {
    projectId,
  });
  return response.data;
};

export const removeProjectFromStaffApi = async (staffId, projectId) => {
  const response = await apiClient.delete(
    `/team/${staffId}/assign-project/${projectId}`,
  );
  return response.data;
};

export const updateStaffStatusApi = async (staffId, status) => {
  const response = await apiClient.patch(`/team/${staffId}/status`, { status });
  return response.data;
};
