const {
  createInvoice,
  findInvoices,
  findInvoiceByProjectId,
  findInvoiceById,
} = require("../repositories/invoice.repository");

const getInvoicesService = async (query = {}) => {
  const invoices = await findInvoices({
    status: query.status || "",
  });

  return invoices.map((item) => ({
    _id: item._id,
    invoiceNumber: item.invoiceNumber || "",
    projectId: item.projectId || "",
    projectName: item.projectName || "",
    projectCode: item.projectCode || "",
    vendorAuthUserId: item.vendorAuthUserId || "",
    vendorName: item.vendorName || "",
    amount: Number(item.amount || item.totalDue || 0),
    taxAmount: Number(item.taxAmount || 0),
    status: (item.status || "").toUpperCase(),
    paymentDate: item.paymentDate || null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
};

const createInvoiceService = async (vendorAuthUserId, payload) => {
  const existing = await findInvoiceByProjectId(payload.projectId);
  if (existing) return existing;

  const amount = Number(payload.amount || 0);
  const taxAmount = Number(payload.taxAmount || 0);
  const totalDue = Number((amount + taxAmount).toFixed(2));

  return createInvoice({
    invoiceNumber: payload.invoiceNumber,
    projectId: payload.projectId,
    projectName: payload.projectName || "",
    projectCode: payload.projectCode || "",
    vendorAuthUserId: payload.vendorAuthUserId || vendorAuthUserId || "",
    vendorName: payload.vendorName || "",
    amount,
    taxAmount,
    totalDue,
    notes: payload.notes || "",
    paymentDate: payload.paymentDate || null,
    status: payload.status || "PENDING",
  });
};

const getInvoiceByProjectService = async (projectId) => {
  return findInvoiceByProjectId(projectId);
};

const getInvoiceByIdService = async (invoiceId) => {
  return findInvoiceById(invoiceId);
};

module.exports = {
  getInvoicesService,
  createInvoiceService,
  getInvoiceByProjectService,
  getInvoiceByIdService,
};
