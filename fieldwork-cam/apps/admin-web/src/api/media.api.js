import { apiClient } from "./client";

export const getProjectMediaApi = async (projectId) => {
  const response = await apiClient.get(`/media/project/${projectId}`);
  return response.data;
};
