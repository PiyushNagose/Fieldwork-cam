const {
  createTicket,
  findTicketsByVendor,
  findAllTickets,
  findLatestTicket,
} = require("../repositories/ticket.repository");
const env = require("../config/env");

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

const resolveSupportOwnerAuthUserId = async (user, authHeader) => {
  if (user?.role === "ADMIN") {
    return user.userId;
  }

  if (user?.role === "STAFF") {
    const response = await fetch(`${env.USER_SERVICE_URL}/users/profile`, {
      headers: {
        authorization: authHeader || "",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to resolve staff support owner");
    }

    const data = await response.json();
    const profile = data?.data || data || {};
    const vendorAuthUserId = profile?.staffProfile?.vendorAuthUserId || "";

    if (!vendorAuthUserId) {
      throw new Error("Staff vendor owner not found");
    }

    return vendorAuthUserId;
  }

  return user?.userId || "";
};

const createSupportTicket = async (user, authHeader, payload) => {
  const normalizedTitle = String(payload.title || payload.subject || "").trim();
  const vendorAuthUserId = await resolveSupportOwnerAuthUserId(user, authHeader);

  const ticket = await createTicket({
    ticketId: await buildTicketId(),
    vendorAuthUserId,
    title: normalizedTitle,
    description: payload.description,
    category: normalizeCategory(payload.category),
    priority: String(payload.priority || "MEDIUM").toUpperCase(),
    status: normalizeStatus(payload.status || "OPEN"),
  });

  return formatTicket(ticket);
};

const getTickets = async (user, query = {}, authHeader) => {
  const { role } = user;
  const { status } = query;
  const normalizedStatus =
    status && status !== "ALL" ? normalizeStatus(status) : undefined;
  const tickets =
    role === "ADMIN"
      ? await findAllTickets(normalizedStatus)
      : await findTicketsByVendor(
          await resolveSupportOwnerAuthUserId(user, authHeader),
          normalizedStatus,
        );

  return tickets.map(formatTicket);
};

module.exports = {
  createSupportTicket,
  getTickets,
};
