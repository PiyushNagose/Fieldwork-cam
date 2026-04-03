const {
  createProject,
  findProjectsByVendor,
  findProjectsByStaff,
  findProjectById,
  pushProjectNote,
  findAllProjects,
  assignVendorToProject,
  assignStaffToProject,
  updateProjectById,
  deleteProjectById,
} = require("../repositories/project.repository");
const ApiError = require("../utils/apiError");
const { createNotifications } = require("./notification.service");
const { saveProjectDataUrlImage } = require("../utils/projectMediaStorage");

const normalizeChecklist = (items = []) =>
  (Array.isArray(items) ? items : [])
    .map((item) => ({
      title: String(item?.title || "").trim(),
      required: Boolean(item?.required),
      captureType: String(item?.captureType || "STANDARD").trim() || "STANDARD",
      completed: Boolean(item?.completed),
    }))
    .filter((item) => item.title);

const normalizeAttachments = (items = []) =>
  (Array.isArray(items) ? items : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean);

const VALID_PROJECT_TRANSITIONS = {
  New: ["In Progress", "Submitted"],
  "In Progress": ["Submitted", "Approved", "Completed"],
  Submitted: ["Approved", "Rejected", "Retake Requested"],
  "Retake Requested": ["In Progress", "Submitted", "Rejected"],
  Approved: ["Completed"],
  Completed: [],
  Rejected: [],
};

const canTransitionStatus = (currentStatus, nextStatus) => {
  if (!currentStatus || !nextStatus || currentStatus === nextStatus) {
    return true;
  }

  return (VALID_PROJECT_TRANSITIONS[currentStatus] || []).includes(nextStatus);
};

const ensureValidStatusTransition = (currentStatus, nextStatus) => {
  if (!canTransitionStatus(currentStatus, nextStatus)) {
    throw new ApiError(
      `Invalid project status transition from ${currentStatus} to ${nextStatus}`,
      400,
    );
  }
};

const sendNotifications = async (items = []) => {
  try {
    await createNotifications(items);
  } catch (error) {
    console.error("Project notification error:", error.message);
  }
};

const ensureProjectAccess = (authUser, project) => {
  if (!project) {
    throw new ApiError("Project not found", 404);
  }

  if (authUser?.role === "ADMIN") {
    return project;
  }

  if (authUser?.role === "STAFF") {
    const assignedStaff = Array.isArray(project.assignedStaff)
      ? project.assignedStaff
      : [];

    const hasAccess = assignedStaff.some(
      (item) => String(item?.staffId || "") === String(authUser?.userId || ""),
    );

    if (!hasAccess) {
      throw new ApiError("Unauthorized project access", 403);
    }

    return project;
  }

  if (
    project.assignedVendorAuthUserId &&
    project.assignedVendorAuthUserId !== authUser?.userId
  ) {
    throw new ApiError("Unauthorized project access", 403);
  }

  return project;
};

const getVendorProjects = async (authUserId, query = {}) => {
  return findProjectsByVendor(authUserId, {
    status: query.status || "",
  });
};

const getProjectById = async (authUser, projectId) => {
  const project = await findProjectById(projectId);
  return ensureProjectAccess(authUser, project);
};

const getProjects = async (authUser, query = {}) => {
  const { userId, role } = authUser;

  if (role === "ADMIN") {
    return findAllProjects({
      status: query.status || "",
      search: query.search || "",
      assignedVendorAuthUserId: query.assignedVendorAuthUserId || "",
      serviceType: query.serviceType || "",
    });
  }

  if (role === "STAFF") {
    return findProjectsByStaff(userId, {
      status: query.status || "",
    });
  }

  return findProjectsByVendor(userId, {
    status: query.status || "",
  });
};

const createVendorProject = async (authUser, payload) => {
  const coverImageUrl =
    payload.coverImageDataUrl && payload.publicBaseUrl
      ? saveProjectDataUrlImage({
          dataUrl: payload.coverImageDataUrl,
          prefix: `project-cover-${payload.workOrderNumber || "draft"}`,
          publicBaseUrl: payload.publicBaseUrl,
        })
      : payload.coverImageUrl || "";

  const project = await createProject({
    workOrderNumber: payload.workOrderNumber,
    title: payload.title,
    address: payload.address,
    serviceType: payload.serviceType || "",
    serviceId: payload.serviceId || "",
    clientName: payload.clientName || "",
    status: payload.status || "New",
    priority: payload.priority || "Medium",
    assignedVendorAuthUserId: payload.assignedVendorAuthUserId || "",
    dueDate: payload.dueDate || null,
    description: payload.description || "",
    progress: payload.progress || 0,
    coverImageUrl,
    checklist: normalizeChecklist(payload.checklist),
    attchments: normalizeAttachments(payload.attachments),
    attachments: normalizeAttachments(payload.attachments),
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
  });

  await sendNotifications([
    authUser?.userId
      ? {
          userId: authUser.userId,
          type: "PROJECT",
          title: "Project created",
          message: `${project.title} was created successfully`,
          meta: {
            projectId: String(project._id),
            projectCode: project.workOrderNumber,
          },
        }
      : null,
    project.assignedVendorAuthUserId &&
    project.assignedVendorAuthUserId !== authUser?.userId
      ? {
          userId: project.assignedVendorAuthUserId,
          type: "PROJECT",
          title: "New project assigned",
          message: `${project.title} has been assigned to you`,
          meta: {
            projectId: String(project._id),
            projectCode: project.workOrderNumber,
          },
        }
      : null,
  ]);

  return project;
};

const updateProject = async (projectId, payload, authUser) => {
  const project = await findProjectById(projectId);

  if (!project) {
    throw new ApiError("Project not found", 404);
  }

  if (typeof payload.status !== "undefined") {
    ensureValidStatusTransition(project.status, payload.status);
  }

  const coverImageUrl =
    payload.coverImageDataUrl && payload.publicBaseUrl
      ? saveProjectDataUrlImage({
          dataUrl: payload.coverImageDataUrl,
          prefix: `project-cover-${project.workOrderNumber || projectId}`,
          publicBaseUrl: payload.publicBaseUrl,
        })
      : payload.coverImageUrl ?? project.coverImageUrl;

  const updated = await updateProjectById(projectId, {
    workOrderNumber: payload.workOrderNumber ?? project.workOrderNumber,
    title: payload.title ?? project.title,
    address: payload.address ?? project.address,
    serviceType: payload.serviceType ?? project.serviceType,
    serviceId: payload.serviceId ?? project.serviceId,
    clientName: payload.clientName ?? project.clientName,
    status: payload.status ?? project.status,
    priority: payload.priority ?? project.priority,
    assignedVendorAuthUserId:
      payload.assignedVendorAuthUserId ?? project.assignedVendorAuthUserId,
    dueDate:
      typeof payload.dueDate !== "undefined" ? payload.dueDate : project.dueDate,
    description: payload.description ?? project.description,
    progress: payload.progress ?? project.progress,
    coverImageUrl,
    checklist:
      typeof payload.checklist !== "undefined"
        ? normalizeChecklist(payload.checklist)
        : project.checklist,
    attchments:
      typeof payload.attachments !== "undefined"
        ? normalizeAttachments(payload.attachments)
        : project.attchments,
    attachments:
      typeof payload.attachments !== "undefined"
        ? normalizeAttachments(payload.attachments)
        : project.attachments,
    latitude:
      typeof payload.latitude !== "undefined" ? payload.latitude : project.latitude,
    longitude:
      typeof payload.longitude !== "undefined"
        ? payload.longitude
        : project.longitude,
  });

  await sendNotifications([
    authUser?.userId
      ? {
          userId: authUser.userId,
          type: "PROJECT",
          title: "Project updated",
          message: `${updated.title} was updated`,
          meta: {
            projectId: String(updated._id),
            projectCode: updated.workOrderNumber,
          },
        }
      : null,
    updated.assignedVendorAuthUserId &&
    updated.assignedVendorAuthUserId !== authUser?.userId
      ? {
          userId: updated.assignedVendorAuthUserId,
          type: "PROJECT",
          title: "Project details updated",
          message: `${updated.title} has updated project details`,
          meta: {
            projectId: String(updated._id),
            projectCode: updated.workOrderNumber,
          },
        }
      : null,
  ]);

  return updated;
};

const getProjectNotes = async (authUser, projectId) => {
  const project = await findProjectById(projectId);
  ensureProjectAccess(authUser, project);

  return (project.notes || []).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
};

const addProjectNote = async (authUser, projectId, note) => {
  const project = await findProjectById(projectId);
  ensureProjectAccess(authUser, project);

  const updatedProject = await pushProjectNote(projectId, {
    note,
    createdByAuthUserId: authUser.userId,
  });

  return updatedProject.notes.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
};

const assignVendor = async (projectId, vendorAuthUserId, authUser) => {
  const project = await findProjectById(projectId);

  if (!project) {
    throw new ApiError("Project not found", 404);
  }

  const updated = await assignVendorToProject(projectId, vendorAuthUserId);

  await sendNotifications([
    authUser?.userId
      ? {
          userId: authUser.userId,
          type: "PROJECT",
          title: "Vendor assigned",
          message: `${updated.title} was assigned to a vendor`,
          meta: {
            projectId: String(updated._id),
            projectCode: updated.workOrderNumber,
          },
        }
      : null,
    vendorAuthUserId
      ? {
          userId: vendorAuthUserId,
          type: "PROJECT",
          title: "New project assigned",
          message: `${updated.title} has been assigned to you`,
          meta: {
            projectId: String(updated._id),
            projectCode: updated.workOrderNumber,
          },
        }
      : null,
  ]);

  return updated;
};

const assignStaff = async (projectId, staffId, authUser) => {
  const project = await findProjectById(projectId);

  if (!project) {
    throw new ApiError("Project not found", 404);
  }

  const updated = await assignStaffToProject(projectId, staffId);
  const statusPromoted =
    updated.status === "New"
      ? await updateProjectById(projectId, { status: "In Progress" })
      : updated;

  await sendNotifications([
    authUser?.userId
      ? {
          userId: authUser.userId,
          type: "STAFF",
          title: "Staff assigned",
          message: `${updated.title} now has a new staff assignment`,
          meta: {
            projectId: String(statusPromoted._id),
            projectCode: statusPromoted.workOrderNumber,
            staffId,
          },
        }
      : null,
  ]);

  return statusPromoted;
};

const updateProjectStatus = async (projectId, status, authUser) => {
  const project = await findProjectById(projectId);

  if (!project) {
    throw new ApiError("Project not found", 404);
  }

  ensureValidStatusTransition(project.status, status);

  const updated = await updateProjectById(projectId, { status });

  await sendNotifications([
    authUser?.userId
      ? {
          userId: authUser.userId,
          type: "PROJECT",
          title: "Project status updated",
          message: `${updated.title} is now ${status}`,
          meta: {
            projectId: String(updated._id),
            projectCode: updated.workOrderNumber,
            status,
          },
        }
      : null,
    updated.assignedVendorAuthUserId &&
    updated.assignedVendorAuthUserId !== authUser?.userId
      ? {
          userId: updated.assignedVendorAuthUserId,
          type: "PROJECT",
          title: "Project status updated",
          message: `${updated.title} is now ${status}`,
          meta: {
            projectId: String(updated._id),
            projectCode: updated.workOrderNumber,
            status,
          },
        }
      : null,
  ]);

  return updated;
};

const removeProject = async (projectId, authUser) => {
  const project = await findProjectById(projectId);

  if (!project) {
    throw new ApiError("Project not found", 404);
  }

  await deleteProjectById(projectId);

  await sendNotifications([
    authUser?.userId
      ? {
          userId: authUser.userId,
          type: "PROJECT",
          title: "Project deleted",
          message: `${project.title} was deleted`,
          meta: {
            projectId: String(project._id),
            projectCode: project.workOrderNumber,
          },
        }
      : null,
  ]);

  return { deleted: true, projectId };
};

module.exports = {
  getVendorProjects,
  getProjectById,
  createVendorProject,
  updateProject,
  getProjectNotes,
  addProjectNote,
  assignVendor,
  assignStaff,
  getProjects,
  updateProjectStatus,
  removeProject,
};
