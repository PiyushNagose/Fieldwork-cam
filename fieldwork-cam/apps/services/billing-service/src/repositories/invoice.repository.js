const Invoice = require("../models/Invoice.model");

const createInvoice = (payload) => Invoice.create(payload);

const findInvoices = (filters = {}) =>
  Invoice.find({
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.vendorAuthUserId
      ? { vendorAuthUserId: filters.vendorAuthUserId }
      : {}),
  }).sort({ createdAt: -1 });

const findInvoiceByProjectId = (projectId) =>
  Invoice.findOne({ projectId }).sort({ createdAt: -1 });

const findInvoiceById = (invoiceId) => Invoice.findById(invoiceId);

module.exports = {
  createInvoice,
  findInvoices,
  findInvoiceByProjectId,
  findInvoiceById,
};
