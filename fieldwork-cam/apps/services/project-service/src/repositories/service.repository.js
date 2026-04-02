const ServiceConfig = require("../models/ServiceConfig.model");

const createService = (payload) => ServiceConfig.create(payload);

const findServices = (filter = {}) =>
  ServiceConfig.find(filter).sort({ createdAt: -1 });

const findServiceById = (id) => ServiceConfig.findById(id);

const updateService = (id, payload) =>
  ServiceConfig.findByIdAndUpdate(id, payload, { new: true });

module.exports = {
  createService,
  findServices,
  findServiceById,
  updateService,
};
