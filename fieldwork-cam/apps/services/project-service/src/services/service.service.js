const ApiError = require("../utils/apiError");
const {
  createService,
  findServices,
  findServiceById,
  updateService,
} = require("../repositories/service.repository");

const getAllServices = async (query = {}) => {
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  return findServices(filter);
};

const getServiceById = async (id) => {
  const service = await findServiceById(id);

  if (!service) {
    throw new ApiError("Service config not found", 404);
  }

  return service;
};

const createServiceConfig = async (payload) => {
  return createService({
    category: payload.category,
    name: payload.name,
    defaultPrice: payload.defaultPrice || 0,
    status: payload.status || "ACTIVE",
    photoChecklist: payload.photoChecklist || [],
    workflowRules: {
      serviceLogic: payload.workflowLogic || "",
      requireSignatureOnCompletion: !!payload.requireSignature,
      autoApproveInvoicesUnder500: !!payload.autoApproveInvoices,
      notifyClientOnDispatch: !!payload.notifyClientOnDispatch,
    },
  });
};

const updateServiceConfig = async (id, payload) => {
  const existing = await findServiceById(id);

  if (!existing) {
    throw new ApiError("Service config not found", 404);
  }

  return updateService(id, {
    category: payload.category ?? existing.category,
    name: payload.name ?? existing.name,
    defaultPrice:
      typeof payload.defaultPrice !== "undefined"
        ? payload.defaultPrice
        : existing.defaultPrice,
    status: payload.status ?? existing.status,
    photoChecklist: payload.photoChecklist ?? existing.photoChecklist,
    workflowRules: {
      serviceLogic:
        typeof payload.workflowLogic !== "undefined"
          ? payload.workflowLogic
          : existing.workflowRules?.serviceLogic || "",
      requireSignatureOnCompletion:
        typeof payload.requireSignature !== "undefined"
          ? payload.requireSignature
          : existing.workflowRules?.requireSignatureOnCompletion || false,
      autoApproveInvoicesUnder500:
        typeof payload.autoApproveInvoices !== "undefined"
          ? payload.autoApproveInvoices
          : existing.workflowRules?.autoApproveInvoicesUnder500 || false,
      notifyClientOnDispatch:
        typeof payload.notifyClientOnDispatch !== "undefined"
          ? payload.notifyClientOnDispatch
          : existing.workflowRules?.notifyClientOnDispatch || false,
    },
  });
};

module.exports = {
  getAllServices,
  getServiceById,
  createServiceConfig,
  updateServiceConfig,
};
