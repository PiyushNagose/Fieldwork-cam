const {
  createTicket,
  findTicketsByVendor,
  findAllTickets,
} = require("../repositories/ticket.repository");

const createSupportTicket = async (vendorAuthUserId, payload) => {
  return createTicket({
    vendorAuthUserId,
    title: payload.title,
    description: payload.description,
    category: payload.category,
    priority: payload.priority || "MEDIUM",
    status: payload.status || "OPEN",
  });
};

const getTickets = async (user, query = {}) => {
  const { userId, role } = user;
  const { status } = query;

  if (role === "ADMIN") {
    return findAllTickets(status);
  }

  return findTicketsByVendor(userId, status);
};

module.exports = {
  createSupportTicket,
  getTickets,
};
