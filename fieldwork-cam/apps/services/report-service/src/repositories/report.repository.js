const Report = require("../models/Report.model");

const findReportsByVendor = (vendorAuthUserId) =>
  Report.find({ vendorAuthUserId }).sort({ createdAt: -1 });

const findReportByProjectId = (projectId) =>
  Report.findOne({ projectId });

const upsertReportByProjectId = async (projectId, payload) => {
  return Report.findOneAndUpdate(
    { projectId },
    payload,
    { new: true, upsert: true }
  );
};

module.exports = {
  findReportsByVendor,
  findReportByProjectId,
  upsertReportByProjectId,
};