const {
  createTicket,
  findTicketsByVendor,
  findLatestTicket,
} = require("../repositories/ticket.repository");

const normalizeStatus = (value = "") => {
  const status = String(value || "").toUpperCase();
  if (status === "IN PROGRESS") return "IN_PROGRESS";
  return ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status)
    ? status
    : "OPEN";
};

const buildTicketId = async () => {
  const latest = await findLatestTicket();
  const latestNumber = Number(String(latest?.ticketId || "").split("-")[1] || 1000);
  return `TKT-${latestNumber + 1}`;
};

const createSupportTicket = async (vendorAuthUserId, payload) => {
  return createTicket({
    ticketId: await buildTicketId(),
    vendorAuthUserId,
    title: payload.title,
    description: payload.description,
    category: String(payload.category || "GENERAL").toUpperCase(),
    priority: String(payload.priority || "MEDIUM").toUpperCase(),
    status: normalizeStatus(payload.status || "OPEN"),
  });
};

const getVendorTickets = async (vendorAuthUserId) => {
  return findTicketsByVendor(vendorAuthUserId);
};

module.exports = {
  createSupportTicket,
  getVendorTickets,
};
