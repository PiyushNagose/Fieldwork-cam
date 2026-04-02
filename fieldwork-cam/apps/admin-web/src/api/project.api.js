import { apiClient } from "./client";

export const getProjectsApi = async (params = {}) => {
  const response = await apiClient.get("/projects", { params });
  return response.data;
};

export const createProjectApi = async (payload) => {
  const response = await apiClient.post("/projects/create", payload);
  return response.data;
};

export const getProjectByIdApi = async (projectId) => {
  const response = await apiClient.get(`/projects/${projectId}`);
  return response.data;
};

export const assignVendorToProjectApi = async (projectId, vendorAuthUserId) => {
  const response = await apiClient.post(
    `/projects/${projectId}/assign-vendor`,
    {
      vendorAuthUserId,
    },
  );
  return response.data;
};

export const assignStaffToProjectApi = async (projectId, staffId) => {
  const response = await apiClient.post(`/projects/${projectId}/assign-staff`, {
    staffId,
  });
  return response.data;
};
