const { asyncHandler } = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const projectService = require("../services/project.service");

const getProjects = asyncHandler(async (req, res) => {
  const projects = await projectService.getProjects(req.user, req.query);
  return successResponse(res, projects, "Projects fetched successfully", 200);
});

const getProjectById = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(
    req.user,
    req.params.projectId,
  );
  return successResponse(res, project, "Project fetched successfully", 200);
});

const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createVendorProject(req.user, req.body);
  return successResponse(res, project, "Project created successfully", 201);
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(
    req.params.projectId,
    req.body,
    req.user,
  );
  return successResponse(res, project, "Project updated successfully", 200);
});

const getProjectNotes = asyncHandler(async (req, res) => {
  const notes = await projectService.getProjectNotes(
    req.user,
    req.params.projectId,
  );
  return successResponse(res, notes, "Project notes fetched successfully", 200);
});

const addProjectNote = asyncHandler(async (req, res) => {
  const notes = await projectService.addProjectNote(
    req.user,
    req.params.projectId,
    req.body.note,
  );
  return successResponse(res, notes, "Project note added successfully", 201);
});

const assignVendor = asyncHandler(async (req, res) => {
  const project = await projectService.assignVendor(
    req.params.projectId,
    req.body.vendorAuthUserId,
    req.user,
  );
  return successResponse(res, project, "Vendor assigned successfully", 200);
});

const assignStaff = asyncHandler(async (req, res) => {
  const project = await projectService.assignStaff(
    req.params.projectId,
    req.body.staffId,
    req.user,
  );
  return successResponse(res, project, "Staff assigned successfully", 200);
});

const unassignStaff = asyncHandler(async (req, res) => {
  const project = await projectService.unassignStaff(
    req.params.projectId,
    req.params.staffId,
    req.user,
  );
  return successResponse(res, project, "Staff removed successfully", 200);
});

const updateProjectStatus = asyncHandler(async (req, res) => {
  const project = await projectService.updateProjectStatus(
    req.params.projectId,
    req.body.status,
    req.user,
  );
  return successResponse(res, project, "Project status updated successfully", 200);
});

const deleteProject = asyncHandler(async (req, res) => {
  const result = await projectService.removeProject(req.params.projectId, req.user);
  return successResponse(res, result, "Project deleted successfully", 200);
});

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  getProjectNotes,
  addProjectNote,
  assignVendor,
  assignStaff,
  unassignStaff,
  updateProjectStatus,
  deleteProject,
};
