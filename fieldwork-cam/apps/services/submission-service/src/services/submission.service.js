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
const { createNotifications } = require("./notification.service");

const sendNotifications = async (items = []) => {
  try {
    await createNotifications(items);
  } catch (error) {
    console.error("Submission notification error:", error.message);
  }
};

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

const SUBMITTABLE_PROJECT_STATUSES = ["New", "In Progress", "Retake Requested"];

const createSubmissionService = async (authUser, payload, authHeader) => {
  const authUserId = authUser?.userId || "";
  const authRole = String(authUser?.role || "").toUpperCase();
  const existing = await findSubmissionByProjectId(payload.projectId);
  if (existing && existing.status !== "Retake Requested") {
    throw new ApiError("Submission already exists for this project", 409);
  }

  const project = await getProject(payload.projectId, authHeader);

  if (!project) {
    throw new ApiError("Project not found", 404);
  }

  if (authRole !== "VENDOR_OWNER") {
    throw new ApiError("Only vendors can submit the project", 403);
  }

  if (
    project.assignedVendorAuthUserId &&
    project.assignedVendorAuthUserId !== authUserId
  ) {
    throw new ApiError("Unauthorized project submission", 403);
  }

  if (!SUBMITTABLE_PROJECT_STATUSES.includes(project.status)) {
    throw new ApiError(
      `Project cannot be submitted while in ${project.status} state`,
      400,
    );
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

  const timelineEvent = {
    type: existing ? "RESUBMITTED" : "SUBMITTED",
    message: existing
      ? "Submission resubmitted after retake request"
      : "Submission created by vendor",
    actorAuthUserId: authUserId,
    createdAt: new Date(),
  };

  const submission = existing
    ? await updateSubmissionById(existing._id, {
        vendorAuthUserId: authUserId,
        photoIds: payload.photoIds,
        aiAverageScore,
        status: "Submitted",
        adminComments: "",
        reviewedByAuthUserId: "",
        reviewedAt: null,
        $push: {
          timeline: timelineEvent,
        },
      })
    : await createSubmission({
        projectId: payload.projectId,
        vendorAuthUserId: authUserId,
        photoIds: payload.photoIds,
        aiAverageScore,
        status: "Submitted",
        timeline: [timelineEvent],
      });

  await updateProjectStatus(payload.projectId, "Submitted", authHeader);

  await sendNotifications([
    {
      userId: authUserId,
      type: "PROJECT",
      title: "Submission created",
      message: `Submission created for ${project.title || "project"}`,
      meta: {
        projectId: payload.projectId,
        submissionId: String(submission._id),
        workOrderNumber: project.workOrderNumber || "",
      },
    },
    project.assignedVendorAuthUserId &&
    project.assignedVendorAuthUserId !== authUserId
      ? {
          userId: project.assignedVendorAuthUserId,
          type: "PROJECT",
          title: "Project submission received",
          message: `A submission was created for ${project.title || "project"}`,
          meta: {
            projectId: payload.projectId,
            submissionId: String(submission._id),
            workOrderNumber: project.workOrderNumber || "",
          },
        }
      : null,
      ]);

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
  return submission || null;
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

  await sendNotifications([
    {
      userId: authUserId,
      type: "PROJECT",
      title: "Submission reviewed",
      message: `Submission was marked ${nextStatus}`,
      meta: {
        projectId: submission.projectId,
        submissionId: String(submission._id),
        status: nextStatus,
      },
    },
    submission.vendorAuthUserId && submission.vendorAuthUserId !== authUserId
      ? {
          userId: submission.vendorAuthUserId,
          type: "PROJECT",
          title:
            nextStatus === "Approved"
              ? "Submission approved"
              : "Submission reviewed",
          message: `Your submission was marked ${nextStatus}`,
          meta: {
            projectId: submission.projectId,
            submissionId: String(submission._id),
            status: nextStatus,
          },
        }
      : null,
  ]);

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

  await sendNotifications([
    {
      userId: authUserId,
      type: "PROJECT",
      title: "Retake requested",
      message: "A retake was requested for the submission",
      meta: {
        projectId: submission.projectId,
        submissionId: String(submission._id),
        status: "Retake Requested",
      },
    },
    submission.vendorAuthUserId && submission.vendorAuthUserId !== authUserId
      ? {
          userId: submission.vendorAuthUserId,
          type: "PROJECT",
          title: "Retake requested",
          message: payload.adminComments || "A retake was requested for your submission",
          meta: {
            projectId: submission.projectId,
            submissionId: String(submission._id),
            status: "Retake Requested",
          },
        }
      : null,
  ]);

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
