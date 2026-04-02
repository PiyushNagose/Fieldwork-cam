import { apiClient } from "./client";

export const getSubmissionByIdApi = async (submissionId) => {
  const response = await apiClient.get(`/submissions/${submissionId}`);
  return response.data;
};

export const getSubmissionByProjectApi = async (projectId) => {
  const response = await apiClient.get(`/submissions/project/${projectId}`);
  return response.data;
};

export const reviewSubmissionApi = async (submissionId, payload = {}) => {
  const response = await apiClient.patch(
    `/submissions/${submissionId}/review`,
    payload,
  );
  return response.data;
};

export const requestRetakeSubmissionApi = async (
  submissionId,
  payload = {},
) => {
  const response = await apiClient.patch(
    `/submissions/${submissionId}/request-retake`,
    payload,
  );
  return response.data;
};
