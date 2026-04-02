const { asyncHandler } = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const ticketService = require("../services/ticket.service");

const createTicket = asyncHandler(async (req, res) => {
  const data = await ticketService.createSupportTicket(
    req.user.userId,
    req.body,
  );

  return successResponse(res, data, "Ticket created", 201);
});

const getTickets = asyncHandler(async (req, res) => {
  const data = await ticketService.getVendorTickets(req.user.userId);

  return successResponse(res, data, "Tickets fetched", 200);
});

module.exports = {
  createTicket,
  getTickets,
};
