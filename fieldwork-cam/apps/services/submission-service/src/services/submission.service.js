const axios = require("axios");
const env = require("../config/env");
const ApiError = require("../utils/apiError");
const {
  createSubmission,
  findSubmissionById,
  findSubmissionByProjectId,
  updateSubmissionById,
  pushTimelineEvent,
} = require("../repositories/submission.repository");

const getProject = async (projectId, authHeader) => {
  const res = await axios.get(
    `${env.PROJECT_SERVICE_URL}/projects/${projectId}`,
    {
      headers: {
        authorization: authHeader,
      },
    }
  );

  return res.data?.data || res.data;
};

const getProjectPhotos = async (projectId, authHeader) => {
  const res = await axios.get(
    `${env.MEDIA_SERVICE_URL}/media/project/${projectId}`,
    {
      headers: {
        authorization: authHeader,
      },
    }
  );

  return res.data?.data || [];
};

const updateProjectStatus = async (projectId, status, authHeader) => {
  await axios.patch(
    `${env.PROJECT_SERVICE_URL}/projects/${projectId}/status`,
    { status },
    {
      headers: {
        authorization: authHeader,
      },
    }
  );
};

const createSubmissionService = async (authUserId, payload, authHeader) => {
  const existing = await findSubmissionByProjectId(payload.projectId);
  if (existing) {
    throw new ApiError("Submission already exists for this project", 409);
  }

  const project = await getProject(payload.projectId, authHeader);

  if (!project) {
    throw new ApiError("Project not found", 404);
  }

  if (
    project.assignedVendorAuthUserId &&
    project.assignedVendorAuthUserId !== authUserId
  ) {
    throw new ApiError("Unauthorized project submission", 403);
  }

  const photos = await getProjectPhotos(payload.projectId, authHeader);

  const selectedPhotos = photos.filter((item) =>
    payload.photoIds.includes(String(item._id))
  );

  if (!selectedPhotos.length) {
    throw new ApiError("No matching uploaded photos found", 400);
  }

  const aiAverageScore = selectedPhotos.length
    ? Math.round(
        selectedPhotos.reduce((sum, item) => sum + (item.aiScore || 0), 0) /
          selectedPhotos.length
      )
    : 0;

  const submission = await createSubmission({
    projectId: payload.projectId,
    vendorAuthUserId: authUserId,
    photoIds: payload.photoIds,
    aiAverageScore,
    status: "Submitted",
    timeline: [
      {
        type: "SUBMITTED",
        message: "Submission created by vendor",
        actorAuthUserId: authUserId,
        createdAt: new Date(),
      },
    ],
  });

  await updateProjectStatus(payload.projectId, "Submitted", authHeader);

  return submission;
};

const getSubmissionByIdService = async (submissionId) => {
  const submission = await findSubmissionById(submissionId);

  if (!submission) {
    throw new ApiError("Submission not found", 404);
  }

  return submission;
};

const getSubmissionByProjectService = async (projectId) => {
  const submission = await findSubmissionByProjectId(projectId);

  if (!submission) {
    throw new ApiError("Submission not found for this project", 404);
  }

  return submission;
};

const reviewSubmissionService = async (
  authUserId,
  submissionId,
  payload,
  authHeader
) => {
  const submission = await findSubmissionById(submissionId);

  if (!submission) {
    throw new ApiError("Submission not found", 404);
  }

  const nextStatus = payload.decision;

  const updated = await updateSubmissionById(submissionId, {
    status: nextStatus,
    adminComments: payload.adminComments || "",
    reviewedByAuthUserId: authUserId,
    reviewedAt: new Date(),
  });

  await updateProjectStatus(submission.projectId, nextStatus, authHeader);

  return pushTimelineEvent(updated._id, {
    type: nextStatus === "Approved" ? "APPROVED" : "REJECTED",
    message:
      nextStatus === "Approved"
        ? "Submission approved by admin"
        : "Submission rejected by admin",
    actorAuthUserId: authUserId,
    createdAt: new Date(),
  });
};

const requestRetakeService = async (
  authUserId,
  submissionId,
  payload,
  authHeader
) => {
  const submission = await findSubmissionById(submissionId);

  if (!submission) {
    throw new ApiError("Submission not found", 404);
  }

  const updated = await updateSubmissionById(submissionId, {
    status: "Retake Requested",
    adminComments: payload.adminComments,
    reviewedByAuthUserId: authUserId,
    reviewedAt: new Date(),
  });

  await updateProjectStatus(
    submission.projectId,
    "Retake Requested",
    authHeader
  );

  return pushTimelineEvent(updated._id, {
    type: "RETAKE_REQUESTED",
    message: payload.adminComments,
    actorAuthUserId: authUserId,
    createdAt: new Date(),
  });
};

module.exports = {
  createSubmissionService,
  getSubmissionByIdService,
  getSubmissionByProjectService,
  reviewSubmissionService,
  requestRetakeService,
};
