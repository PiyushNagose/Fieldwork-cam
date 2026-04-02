const {
  createTicket,
  findTicketsByVendor,
} = require("../repositories/ticket.repository");

const createSupportTicket = async (vendorAuthUserId, payload) => {
  return createTicket({
    vendorAuthUserId,
    title: payload.title,
    description: payload.description,
    category: payload.category,
  });
};

const getVendorTickets = async (vendorAuthUserId) => {
  return findTicketsByVendor(vendorAuthUserId);
};

module.exports = {
  createSupportTicket,
  getVendorTickets,
};
