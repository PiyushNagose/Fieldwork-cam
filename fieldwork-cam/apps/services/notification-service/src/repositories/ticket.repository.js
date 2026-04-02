const Ticket = require("../models/Ticket.model");

const createTicket = (payload) => Ticket.create(payload);

const findLatestTicket = () => Ticket.findOne().sort({ createdAt: -1 });

const findTicketsByVendor = (vendorAuthUserId, status) => {
  const filter = { vendorAuthUserId };

  if (status) {
    filter.status = status;
  }

  return Ticket.find(filter).sort({ createdAt: -1 });
};

const findAllTickets = (status) => {
  const filter = {};

  if (status) {
    filter.status = status;
  }

  return Ticket.find(filter).sort({ createdAt: -1 });
};

module.exports = {
  createTicket,
  findTicketsByVendor,
  findAllTickets,
  findLatestTicket,
};
