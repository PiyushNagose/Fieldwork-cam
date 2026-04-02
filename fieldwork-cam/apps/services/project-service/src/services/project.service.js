const {
  createProject,
  findProjectsByVendor,
  findProjectById,
  pushProjectNote,
  findAllProjects,
  assignVendorToProject,
  assignStaffToProject,
  updateProjectById,
} = require("../repositories/project.repository");
const ApiError = require("../utils/apiError");

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

const ensureProjectAccess = (authUser, project) => {
  if (!project) {
    throw new ApiError("Project not found", 404);
  }

  if (authUser?.role === "ADMIN") {
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

const getProjects = async (authUser) => {
  const { userId, role } = authUser;

  if (role === "ADMIN") {
    return findAllProjects();
  }

  return findProjectsByVendor(userId);
};

const createVendorProject = async (payload) => {
  return createProject({
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
    coverImageUrl: payload.coverImageUrl || "",
    checklist: normalizeChecklist(payload.checklist),
    attchments: normalizeAttachments(payload.attachments),
    attachments: normalizeAttachments(payload.attachments),
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
  });
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

const assignVendor = async (projectId, vendorAuthUserId) => {
  const project = await findProjectById(projectId);

  if (!project) {
    throw new ApiError("Project not found", 404);
  }

  return assignVendorToProject(projectId, vendorAuthUserId);
};

const assignStaff = async (projectId, staffId) => {
  const project = await findProjectById(projectId);

  if (!project) {
    throw new ApiError("Project not found", 404);
  }

  return assignStaffToProject(projectId, staffId);
};

const updateProjectStatus = async (projectId, status) => {
  const project = await findProjectById(projectId);

  if (!project) {
    throw new ApiError("Project not found", 404);
  }

  return updateProjectById(projectId, { status });
};

module.exports = {
  getVendorProjects,
  getProjectById,
  createVendorProject,
  getProjectNotes,
  addProjectNote,
  assignVendor,
  assignStaff,
  getProjects,
  updateProjectStatus,
};
