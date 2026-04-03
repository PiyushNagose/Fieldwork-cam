const { asyncHandler } = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const invoiceService = require("../services/invoice.service");

const getInvoices = asyncHandler(async (req, res) => {
  const invoices = await invoiceService.getInvoicesService(req.query);
  return successResponse(res, invoices, "Invoices fetched successfully", 200);
});

const createInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.createInvoiceService(
    req.user,
    req.body,
    req.headers.authorization,
  );
  return successResponse(res, invoice, "Invoice created successfully", 201);
});

const getInvoiceByProject = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.getInvoiceByProjectService(
    req.params.projectId,
  );
  return successResponse(res, invoice, "Invoice fetched successfully", 200);
});

const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.getInvoiceByIdService(
    req.params.invoiceId,
  );
  return successResponse(res, invoice, "Invoice fetched successfully", 200);
});

module.exports = {
  getInvoices,
  createInvoice,
  getInvoiceByProject,
  getInvoiceById,
};
