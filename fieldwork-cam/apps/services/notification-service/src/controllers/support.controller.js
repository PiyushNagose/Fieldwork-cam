const { asyncHandler } = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const supportService = require("../services/support.service");

const createTicket = asyncHandler(async (req, res) => {
  const data = await supportService.createSupportTicket(
    req.user,
    req.headers.authorization,
    req.body,
  );

  return successResponse(res, data, "Support ticket created successfully", 201);
});

const getTickets = asyncHandler(async (req, res) => {
  const data = await supportService.getTickets(
    req.user,
    req.query,
    req.headers.authorization,
  );

  return successResponse(
    res,
    data,
    "Support tickets fetched successfully",
    200,
  );
});

module.exports = {
  createTicket,
  getTickets,
};
