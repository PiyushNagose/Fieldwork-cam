const Invoice = require("../models/Invoice.model");

const createInvoice = (payload) => Invoice.create(payload);

const findInvoices = (filters = {}) =>
  Invoice.find({
    ...(filters.status ? { status: filters.status } : {}),
  }).sort({ createdAt: -1 });

const findInvoiceByProjectId = (projectId) => Invoice.findOne({ projectId });

const findInvoiceById = (invoiceId) => Invoice.findById(invoiceId);

module.exports = {
  createInvoice,
  findInvoices,
  findInvoiceByProjectId,
  findInvoiceById,
};
