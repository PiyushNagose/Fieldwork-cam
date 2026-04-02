const {
  createProject,
  findProjectsByVendor,
  findProjectById,
  pushProjectNote,
  findAllProjects,
  assignVendorToProject,
  assignStaffToProject,
} = require("../repositories/project.repository");
const ApiError = require("../utils/apiError");

const getVendorProjects = async (authUserId, query = {}) => {
  return findProjectsByVendor(authUserId, {
    status: query.status || "",
  });
};

const getProjectById = async (authUserId, projectId) => {
  const project = await findProjectById(projectId);

  if (!project) {
    throw new ApiError("Project not found", 404);
  }

  if (
    project.assignedVendorAuthUserId &&
    project.assignedVendorAuthUserId !== authUserId
  ) {
    throw new ApiError("Unauthorized project access", 403);
  }

  return project;
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
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
  });
};

const getProjectNotes = async (authUserId, projectId) => {
  const project = await findProjectById(projectId);

  if (!project) {
    throw new ApiError("Project not found", 404);
  }

  if (
    project.assignedVendorAuthUserId &&
    project.assignedVendorAuthUserId !== authUserId
  ) {
    throw new ApiError("Unauthorized project access", 403);
  }

  return (project.notes || []).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
};

const addProjectNote = async (authUserId, projectId, note) => {
  const project = await findProjectById(projectId);

  if (!project) {
    throw new ApiError("Project not found", 404);
  }

  if (
    project.assignedVendorAuthUserId &&
    project.assignedVendorAuthUserId !== authUserId
  ) {
    throw new ApiError("Unauthorized project access", 403);
  }

  const updatedProject = await pushProjectNote(projectId, {
    note,
    createdByAuthUserId: authUserId,
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

module.exports = {
  getVendorProjects,
  getProjectById,
  createVendorProject,
  getProjectNotes,
  addProjectNote,
  assignVendor,
  assignStaff,
  getProjects,
};
