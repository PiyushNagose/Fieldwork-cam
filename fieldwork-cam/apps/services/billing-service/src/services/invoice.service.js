const {
  createInvoice,
  findInvoices,
  findInvoiceByProjectId,
  findInvoiceById,
} = require("../repositories/invoice.repository");
const env = require("../config/env");
const { createNotifications } = require("./notification.service");

const buildError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const sendNotifications = async (items = []) => {
  try {
    await createNotifications(items);
  } catch (error) {
    console.error("Invoice notification error:", error.message);
  }
};

const getProject = async (projectId, authHeader) => {
  const response = await fetch(`${env.PROJECT_SERVICE_URL}/projects/${projectId}`, {
    headers: {
      authorization: authHeader || "",
    },
  });

  if (!response.ok) {
    throw buildError("Failed to fetch linked project for invoice", 400);
  }

  const data = await response.json();
  return data?.data || data || null;
};

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

const createInvoiceService = async (authUser, payload, authHeader) => {
  const authRole = String(authUser?.role || "").toUpperCase();
  const isAdmin = authRole === "ADMIN";
  const isVendor = authRole === "VENDOR_OWNER";

  if (!isAdmin && !isVendor) {
    throw buildError("You are not allowed to create invoices", 403);
  }

  const project = await getProject(payload.projectId, authHeader);

  if (!project) {
    throw buildError("Project not found for invoice", 404);
  }

  if (!["Approved", "Completed"].includes(project.status)) {
    throw buildError(
      "Invoice can only be created for approved or completed projects",
      400,
    );
  }

  if (
    payload.vendorAuthUserId &&
    project.assignedVendorAuthUserId &&
    payload.vendorAuthUserId !== project.assignedVendorAuthUserId
  ) {
    throw buildError(
      "Invoice vendor does not match the assigned project vendor",
      400,
    );
  }

  if (isVendor && project.assignedVendorAuthUserId !== authUser?.userId) {
    throw buildError("You can only create invoices for your assigned projects", 403);
  }

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

  const requestedStatus = String(payload.status || "PENDING").toUpperCase();
  const invoice = await createInvoice({
    invoiceNumber: payload.invoiceNumber,
    projectId: payload.projectId,
    projectName: payload.projectName || "",
    projectCode: payload.projectCode || "",
    vendorAuthUserId:
      payload.vendorAuthUserId || project.assignedVendorAuthUserId || "",
    vendorName: payload.vendorName || "",
    billToClient: payload.billToClient || project.clientName || "",
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
    status: isAdmin ? requestedStatus : "PENDING",
    paymentTerms: payload.paymentTerms || "Net 14",
    signatureName: payload.signatureName || "",
  });

  if ((invoice.status || "").toUpperCase() === "PAID") {
    await fetch(`${env.PROJECT_SERVICE_URL}/projects/${project.projectId || project._id || payload.projectId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        authorization: authHeader || "",
      },
      body: JSON.stringify({ status: "Completed" }),
    }).catch(() => null);
  }

  await sendNotifications([
    authUser?.userId
      ? {
          userId: authUser.userId,
          type: "INVOICE",
          title: "Invoice created",
          message: `${invoice.invoiceNumber || "A new invoice"} was created`,
          meta: {
            invoiceId: String(invoice._id),
            projectId: invoice.projectId,
            invoiceNumber: invoice.invoiceNumber,
          },
        }
      : null,
    invoice.vendorAuthUserId && invoice.vendorAuthUserId !== authUser?.userId
      ? {
          userId: invoice.vendorAuthUserId,
          type: "PAYMENT",
          title: "New invoice available",
          message: `${invoice.invoiceNumber || "A new invoice"} is ready for review`,
          meta: {
            invoiceId: String(invoice._id),
            projectId: invoice.projectId,
            invoiceNumber: invoice.invoiceNumber,
          },
        }
      : null,
  ]);

  return invoice;
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
