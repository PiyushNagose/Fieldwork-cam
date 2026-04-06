import { apiClient } from "./client";
import { resolveMediaUrl } from "../utils/mediaUrl";

const normalizeProject = (project) => {
  if (!project || typeof project !== "object") return project;

  return {
    ...project,
    coverImageUrl: resolveMediaUrl(project.coverImageUrl || ""),
  };
};

export const getProjectsApi = async (params = {}) => {
  const response = await apiClient.get("/projects", { params });
  const payload = response.data;
  const data = payload?.data || payload || [];

  if (!Array.isArray(data)) return payload;

  const normalized = data.map(normalizeProject);

  if (Array.isArray(payload)) {
    return normalized;
  }

  return {
    ...payload,
    data: normalized,
  };
};

export const createProjectApi = async (payload) => {
  const response = await apiClient.post("/projects/create", payload);
  return response.data;
};

export const getProjectByIdApi = async (projectId) => {
  const response = await apiClient.get(`/projects/${projectId}`);
  const payload = response.data;
  const data = payload?.data || payload || null;

  if (!data || Array.isArray(data)) return payload;

  const normalized = normalizeProject(data);

  if (!payload?.data) {
    return normalized;
  }

  return {
    ...payload,
    data: normalized,
  };
};

export const updateProjectApi = async (projectId, payload) => {
  const response = await apiClient.put(`/projects/${projectId}`, payload);
  return response.data;
};

export const deleteProjectApi = async (projectId) => {
  const response = await apiClient.delete(`/projects/${projectId}`);
  return response.data;
};

export const getProjectNotesApi = async (projectId) => {
  const response = await apiClient.get(`/projects/${projectId}/notes`);
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

export const removeStaffFromProjectApi = async (projectId, staffId) => {
  const response = await apiClient.delete(
    `/projects/${projectId}/assign-staff/${staffId}`,
  );
  return response.data;
};
