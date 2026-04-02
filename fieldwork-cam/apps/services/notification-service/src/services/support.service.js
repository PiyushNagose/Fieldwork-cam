const {
  createTicket,
  findTicketsByVendor,
  findAllTickets,
  findLatestTicket,
} = require("../repositories/ticket.repository");

const normalizeStatus = (value = "") => {
  const status = String(value || "").toUpperCase();
  if (status === "IN PROGRESS") return "IN_PROGRESS";
  return ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status)
    ? status
    : "OPEN";
};

const normalizeCategory = (value = "") => {
  const category = String(value || "").toUpperCase().replace(/\s+/g, "_");
  return [
    "TECHNICAL_ISSUE",
    "BILLING",
    "ACCOUNT",
    "FEATURE_REQUEST",
    "GENERAL",
  ].includes(category)
    ? category
    : "GENERAL";
};

const buildTicketId = async () => {
  const latest = await findLatestTicket();
  const latestNumber = Number(String(latest?.ticketId || "").split("-")[1] || 1000);
  return `TKT-${latestNumber + 1}`;
};

const formatCategoryLabel = (value = "") =>
  String(value || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");

const formatStatusLabel = (value = "") =>
  String(value || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");

const formatTicket = (ticket) => ({
  _id: ticket._id,
  ticketId: ticket.ticketId,
  vendorAuthUserId: ticket.vendorAuthUserId,
  subject: ticket.title,
  title: ticket.title,
  description: ticket.description,
  category: ticket.category,
  categoryLabel: formatCategoryLabel(ticket.category),
  priority: ticket.priority || "MEDIUM",
  status: normalizeStatus(ticket.status),
  statusLabel: formatStatusLabel(normalizeStatus(ticket.status)),
  createdAt: ticket.createdAt,
  updatedAt: ticket.updatedAt,
});

const createSupportTicket = async (vendorAuthUserId, payload) => {
  const ticket = await createTicket({
    ticketId: await buildTicketId(),
    vendorAuthUserId,
    title: payload.title,
    description: payload.description,
    category: normalizeCategory(payload.category),
    priority: String(payload.priority || "MEDIUM").toUpperCase(),
    status: normalizeStatus(payload.status || "OPEN"),
  });

  return formatTicket(ticket);
};

const getTickets = async (user, query = {}) => {
  const { userId, role } = user;
  const { status } = query;
  const normalizedStatus =
    status && status !== "ALL" ? normalizeStatus(status) : undefined;
  const tickets =
    role === "ADMIN"
      ? await findAllTickets(normalizedStatus)
      : await findTicketsByVendor(userId, normalizedStatus);

  return tickets.map(formatTicket);
};

module.exports = {
  createSupportTicket,
  getTickets,
};
