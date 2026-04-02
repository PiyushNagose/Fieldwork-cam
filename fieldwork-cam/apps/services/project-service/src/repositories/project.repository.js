const Project = require("../models/Project.model");

const createProject = (payload) => Project.create(payload);

const findProjectsByVendor = (assignedVendorAuthUserId, filters = {}) =>
  Project.find({
    assignedVendorAuthUserId,
    ...(filters.status ? { status: filters.status } : {}),
  }).sort({ createdAt: -1 });
const findAllProjects = () => Project.find({}).sort({ createdAt: -1 });

const findProjectById = (projectId) => Project.findById(projectId);

const updateProjectById = (projectId, payload) =>
  Project.findByIdAndUpdate(projectId, payload, { new: true });

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
  findProjectById,
  updateProjectById,
  pushProjectNote,
  assignVendorToProject,
  findAllProjects,
  assignStaffToProject,
};
