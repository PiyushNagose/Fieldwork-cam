const ApiError = require("../utils/apiError");
const {
  createService,
  findServices,
  findServiceById,
  updateService,
} = require("../repositories/service.repository");

const normalizeWorkflowRules = (payload = {}, fallback = {}) => {
  const nestedRules = payload.workflowRules || {};

  return {
    serviceLogic:
      typeof nestedRules.serviceLogic !== "undefined"
        ? nestedRules.serviceLogic
        : typeof payload.workflowLogic !== "undefined"
          ? payload.workflowLogic
          : fallback.serviceLogic || "",
    requireSignatureOnCompletion:
      typeof nestedRules.requireSignatureOnCompletion !== "undefined"
        ? Boolean(nestedRules.requireSignatureOnCompletion)
        : typeof payload.requireSignature !== "undefined"
          ? Boolean(payload.requireSignature)
          : Boolean(fallback.requireSignatureOnCompletion),
    autoApproveInvoicesUnder500:
      typeof nestedRules.autoApproveInvoicesUnder500 !== "undefined"
        ? Boolean(nestedRules.autoApproveInvoicesUnder500)
        : typeof payload.autoApproveInvoices !== "undefined"
          ? Boolean(payload.autoApproveInvoices)
          : Boolean(fallback.autoApproveInvoicesUnder500),
    notifyClientOnDispatch:
      typeof nestedRules.notifyClientOnDispatch !== "undefined"
        ? Boolean(nestedRules.notifyClientOnDispatch)
        : typeof payload.notifyClientOnDispatch !== "undefined"
          ? Boolean(payload.notifyClientOnDispatch)
          : Boolean(fallback.notifyClientOnDispatch),
  };
};

const normalizePhotoChecklist = (photoChecklist = []) =>
  (Array.isArray(photoChecklist) ? photoChecklist : [])
    .map((item) => ({
      title: String(item?.title || "").trim(),
      required: Boolean(item?.required),
      captureType: String(item?.captureType || "STANDARD").trim() || "STANDARD",
    }))
    .filter((item) => item.title);

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
    photoChecklist: normalizePhotoChecklist(payload.photoChecklist),
    workflowRules: normalizeWorkflowRules(payload),
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
    photoChecklist:
      typeof payload.photoChecklist !== "undefined"
        ? normalizePhotoChecklist(payload.photoChecklist)
        : existing.photoChecklist,
    workflowRules: normalizeWorkflowRules(payload, existing.workflowRules || {}),
  });
};

module.exports = {
  getAllServices,
  getServiceById,
  createServiceConfig,
  updateServiceConfig,
};
