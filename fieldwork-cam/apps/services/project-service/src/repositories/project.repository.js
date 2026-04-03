const Project = require("../models/Project.model");

const createProject = (payload) => Project.create(payload);

const findProjectsByVendor = (assignedVendorAuthUserId, filters = {}) =>
  Project.find({
    assignedVendorAuthUserId,
    ...(filters.status ? { status: filters.status } : {}),
  }).sort({ createdAt: -1 });

const findProjectsByStaff = (staffAuthUserId, filters = {}) =>
  Project.find({
    "assignedStaff.staffId": staffAuthUserId,
    ...(filters.status ? { status: filters.status } : {}),
  }).sort({ createdAt: -1 });

const buildProjectFilters = (filters = {}) => {
  const query = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.assignedVendorAuthUserId) {
    query.assignedVendorAuthUserId = filters.assignedVendorAuthUserId;
  }

  if (filters.serviceType) {
    query.serviceType = filters.serviceType;
  }

  if (filters.search) {
    query.$or = [
      { workOrderNumber: { $regex: filters.search, $options: "i" } },
      { title: { $regex: filters.search, $options: "i" } },
      { address: { $regex: filters.search, $options: "i" } },
      { serviceType: { $regex: filters.search, $options: "i" } },
      { clientName: { $regex: filters.search, $options: "i" } },
    ];
  }

  return query;
};

const findAllProjects = (filters = {}) =>
  Project.find(buildProjectFilters(filters)).sort({ createdAt: -1 });

const findProjectById = (projectId) => Project.findById(projectId);

const updateProjectById = (projectId, payload) =>
  Project.findByIdAndUpdate(projectId, payload, { new: true });

const deleteProjectById = (projectId) => Project.findByIdAndDelete(projectId);

const pushProjectNote = async (projectId, notePayload) => {
  await Project.findByIdAndUpdate(
    projectId,
    {
      $push: {
        notes: notePayload,
      },
    },
    { new: true },
  );

  return Project.findById(projectId);
};

const assignVendorToProject = (projectId, vendorAuthUserId) =>
  Project.findByIdAndUpdate(
    projectId,
    { assignedVendorAuthUserId: vendorAuthUserId },
    { new: true },
  );

const assignStaffToProject = (projectId, staffId) =>
  Project.findByIdAndUpdate(
    projectId,
    {
      $addToSet: {
        assignedStaff: {
          staffId,
          assignedAt: new Date(),
        },
      },
    },
    { new: true },
  );

module.exports = {
  createProject,
  findProjectsByVendor,
  findProjectsByStaff,
  findProjectById,
  updateProjectById,
  pushProjectNote,
  assignVendorToProject,
  findAllProjects,
  assignStaffToProject,
  deleteProjectById,
};
