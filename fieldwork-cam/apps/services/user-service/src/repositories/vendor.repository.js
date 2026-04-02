const VendorProfile = require("../models/VendorProfile.model");

const createVendorProfile = (payload) => VendorProfile.create(payload);

const findAllVendorProfiles = async (filters, limit = 10, offset = 0) => {
  return VendorProfile.find(filters)
    .skip(Number(offset))
    .limit(Number(limit))
    .sort({ createdAt: -1 }); // Sort by creation date
};

const findVendorProfileById = (id) => VendorProfile.findById(id);

const findByAuthUserId = (authUserId) => VendorProfile.findOne({ authUserId });

module.exports = {
  createVendorProfile,
  findAllVendorProfiles,
  findVendorProfileById,
  findByAuthUserId,
};
