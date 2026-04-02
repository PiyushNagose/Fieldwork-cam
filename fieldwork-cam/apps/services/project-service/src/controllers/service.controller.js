const { asyncHandler } = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const serviceService = require("../services/service.service");

const getServices = asyncHandler(async (req, res) => {
  const data = await serviceService.getAllServices(req.query);
  return successResponse(res, data, "Services fetched successfully", 200);
});

const getService = asyncHandler(async (req, res) => {
  const data = await serviceService.getServiceById(req.params.id);
  return successResponse(res, data, "Service fetched successfully", 200);
});

const createService = asyncHandler(async (req, res) => {
  const data = await serviceService.createServiceConfig(req.body);
  return successResponse(res, data, "Service created successfully", 201);
});

const updateService = asyncHandler(async (req, res) => {
  const data = await serviceService.updateServiceConfig(
    req.params.id,
    req.body,
  );
  return successResponse(res, data, "Service updated successfully", 200);
});

module.exports = {
  getServices,
  getService,
  createService,
  updateService,
};
