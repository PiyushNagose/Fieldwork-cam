const {
  createInvoice,
  findInvoices,
  findInvoiceByProjectId,
  findInvoiceById,
} = require("../repositories/invoice.repository");

const getInvoicesService = async (query = {}) => {
  const invoices = await findInvoices({
    status: query.status || "",
    vendorAuthUserId: query.vendorAuthUserId || "",
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
    subtotal: Number(item.subtotal || 0),
    taxAmount: Number(item.taxAmount || 0),
    totalDue: Number(item.totalDue || item.amount || 0),
    status: (item.status || "").toUpperCase(),
    invoiceDate: item.invoiceDate || null,
    dueDate: item.dueDate || null,
    paymentDate: item.paymentDate || null,
    paymentTerms: item.paymentTerms || "",
    billToClient: item.billToClient || "",
    lineItems: Array.isArray(item.lineItems) ? item.lineItems : [],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
};

const normalizeLineItems = (lineItems = []) =>
  (Array.isArray(lineItems) ? lineItems : [])
    .map((item) => {
      const qty = Number(item?.qty || 0);
      const rate = Number(item?.rate || 0);
      const amount =
        typeof item?.amount !== "undefined"
          ? Number(item.amount || 0)
          : Number((qty * rate).toFixed(2));

      return {
        description: String(item?.description || "").trim(),
        qty,
        rate,
        amount,
      };
    })
    .filter((item) => item.description || item.amount);

const createInvoiceService = async (vendorAuthUserId, payload) => {
  const lineItems = normalizeLineItems(payload.lineItems);
  const derivedSubtotal = Number(
    lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2),
  );
  const subtotal = Number(
    (
      typeof payload.subtotal !== "undefined"
        ? Number(payload.subtotal || 0)
        : derivedSubtotal || Number(payload.amount || 0)
    ).toFixed(2),
  );
  const taxPercent = Number(payload.taxPercent || 0);
  const taxAmount = Number(
    (
      typeof payload.taxAmount !== "undefined"
        ? Number(payload.taxAmount || 0)
        : (subtotal * taxPercent) / 100
    ).toFixed(2),
  );
  const totalDue = Number((subtotal + taxAmount).toFixed(2));
  const amount = Number(
    (
      typeof payload.amount !== "undefined"
        ? Number(payload.amount || 0)
        : subtotal || totalDue
    ).toFixed(2),
  );

  return createInvoice({
    invoiceNumber: payload.invoiceNumber,
    projectId: payload.projectId,
    projectName: payload.projectName || "",
    projectCode: payload.projectCode || "",
    vendorAuthUserId: payload.vendorAuthUserId || vendorAuthUserId || "",
    vendorName: payload.vendorName || "",
    billToClient: payload.billToClient || "",
    invoiceDate: payload.invoiceDate || new Date(),
    dueDate: payload.dueDate || null,
    lineItems,
    amount,
    subtotal,
    taxPercent,
    taxAmount,
    totalDue,
    notes: payload.notes || "",
    paymentDate: payload.paymentDate || null,
    status: payload.status || "PENDING",
    paymentTerms: payload.paymentTerms || "Net 14",
    signatureName: payload.signatureName || "",
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
