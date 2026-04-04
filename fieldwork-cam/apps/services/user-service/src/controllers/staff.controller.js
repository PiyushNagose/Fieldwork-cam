const { asyncHandler } = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");
const staffService = require("../services/staff.service");

// 🔷 CREATE STAFF
const createStaff = asyncHandler(async (req, res) => {
  const vendorAuthUserId = req.user.userId;

  if (!vendorAuthUserId) {
    throw new ApiError("Unauthorized", 401);
  }

  const data = await staffService.createStaff(vendorAuthUserId, req.body);

  return successResponse(res, data, "Staff created successfully", 201);
});

// 🔷 GET TEAM (WITH FILTER + SEARCH)
const getTeam = asyncHandler(async (req, res) => {
  const vendorAuthUserId = req.user.userId;

  const query = {
    status: req.query.status,
    search: req.query.search,
  };

  const data = await staffService.getVendorTeam(vendorAuthUserId, query);

  return successResponse(res, data, "Team fetched successfully", 200);
});

// 🔷 GET STAFF DETAILS
const getStaffDetails = asyncHandler(async (req, res) => {
  const vendorAuthUserId = req.user.userId;
  const staffAuthUserId = req.params.id;

  if (!staffAuthUserId) {
    throw new ApiError("Staff ID is required", 400);
  }

  const data = await staffService.getStaffDetails(
    vendorAuthUserId,
    staffAuthUserId,
  );

  return successResponse(res, data, "Staff details fetched successfully", 200);
});

// 🔷 ASSIGN PROJECT
const assignProject = asyncHandler(async (req, res) => {
  const vendorAuthUserId = req.user.userId;
  const staffAuthUserId = req.params.id;
  const { projectId } = req.body;

  if (!staffAuthUserId || !projectId) {
    throw new ApiError("Staff ID and projectId are required", 400);
  }

  const data = await staffService.assignProjectToStaff(
    vendorAuthUserId,
    staffAuthUserId,
    projectId,
  );

  return successResponse(res, data, "Project assigned successfully", 200);
});

const unassignProject = asyncHandler(async (req, res) => {
  const vendorAuthUserId = req.user.userId;
  const staffAuthUserId = req.params.id;
  const { projectId } = req.params;

  if (!staffAuthUserId || !projectId) {
    throw new ApiError("Staff ID and projectId are required", 400);
  }

  const data = await staffService.unassignProjectFromStaff(
    vendorAuthUserId,
    staffAuthUserId,
    projectId,
  );

  return successResponse(res, data, "Project removed successfully", 200);
});

const updateStaff = asyncHandler(async (req, res) => {
  const vendorAuthUserId = req.user.userId;
  const staffAuthUserId = req.params.id;

  if (!staffAuthUserId) {
    throw new ApiError("Staff ID is required", 400);
  }

  const data = await staffService.updateStaff(
    vendorAuthUserId,
    staffAuthUserId,
    req.body,
  );

  return successResponse(res, data, "Staff updated successfully", 200);
});

// 🔷 UPDATE STATUS (NEW)
const updateStatus = asyncHandler(async (req, res) => {
  const vendorAuthUserId = req.user.userId;
  const staffAuthUserId = req.params.id;
  const { status } = req.body;

  if (!staffAuthUserId || !status) {
    throw new ApiError("Staff ID and status are required", 400);
  }

  const data = await staffService.updateStaffStatus(
    vendorAuthUserId,
    staffAuthUserId,
    status,
  );

  return successResponse(res, data, "Status updated successfully", 200);
});

// 🔷 STAFF STATS (NEW)
const getStaffStats = asyncHandler(async (req, res) => {
  const vendorAuthUserId = req.user.userId;

  const data = await staffService.getStaffStats(vendorAuthUserId);

  return successResponse(res, data, "Staff stats fetched successfully", 200);
});

const removeStaff = asyncHandler(async (req, res) => {
  const vendorAuthUserId = req.user.userId;
  const staffAuthUserId = req.params.id;

  if (!staffAuthUserId) {
    throw new ApiError("Staff ID is required", 400);
  }

  const data = await staffService.removeStaff(vendorAuthUserId, staffAuthUserId);

  return successResponse(res, data, "Staff removed successfully", 200);
});

module.exports = {
  createStaff,
  getTeam,
  getStaffDetails,
  assignProject,
  unassignProject,
  updateStaff,
  updateStatus, // NEW
  removeStaff,
  getStaffStats, // NEW
};
