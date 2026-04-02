const { asyncHandler } = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const projectService = require("../services/project.service");

const getProjects = asyncHandler(async (req, res) => {
  const projects = await projectService.getProjects(req.user, req.query);
  return successResponse(res, projects, "Projects fetched successfully", 200);
});

const getProjectById = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(
    req.user.userId,
    req.params.projectId,
  );
  return successResponse(res, project, "Project fetched successfully", 200);
});

const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createVendorProject(req.body);
  return successResponse(res, project, "Project created successfully", 201);
});

const getProjectNotes = asyncHandler(async (req, res) => {
  const notes = await projectService.getProjectNotes(
    req.user.userId,
    req.params.projectId,
  );
  return successResponse(res, notes, "Project notes fetched successfully", 200);
});

const addProjectNote = asyncHandler(async (req, res) => {
  const notes = await projectService.addProjectNote(
    req.user.userId,
    req.params.projectId,
    req.body.note,
  );
  return successResponse(res, notes, "Project note added successfully", 201);
});

const assignVendor = asyncHandler(async (req, res) => {
  const project = await projectService.assignVendor(
    req.params.projectId,
    req.body.vendorAuthUserId,
  );
  return successResponse(res, project, "Vendor assigned successfully", 200);
});

const assignStaff = asyncHandler(async (req, res) => {
  const project = await projectService.assignStaff(
    req.params.projectId,
    req.body.staffId,
  );
  return successResponse(res, project, "Staff assigned successfully", 200);
});

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  getProjectNotes,
  addProjectNote,
  assignVendor,
  assignStaff,
};
