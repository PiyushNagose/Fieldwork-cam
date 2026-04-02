import { apiClient } from "./client";

// 🔷 GET TEAM (supports search + status)
export const getStaffApi = async (params = {}) => {
  const response = await apiClient.get("/team", { params });
  return response.data;
};

// 🔷 GET STAFF STATS
export const getStaffStatsApi = async () => {
  const response = await apiClient.get("/team/stats");
  return response.data;
};

// 🔷 CREATE STAFF
export const createStaffApi = async (payload) => {
  const response = await apiClient.post("/team/add", payload);
  return response.data;
};

// 🔷 GET STAFF DETAILS
export const getStaffByIdApi = async (staffId) => {
  const response = await apiClient.get(`/team/${staffId}`);
  return response.data;
};

// 🔷 ASSIGN PROJECT
export const assignProjectToStaffApi = async (staffId, projectId) => {
  const response = await apiClient.post(`/team/${staffId}/assign-project`, {
    projectId,
  });
  return response.data;
};

// 🔷 UPDATE STATUS (activate / deactivate / on leave)
export const updateStaffStatusApi = async (staffId, status) => {
  const response = await apiClient.patch(`/team/${staffId}/status`, { status });
  return response.data;
};
