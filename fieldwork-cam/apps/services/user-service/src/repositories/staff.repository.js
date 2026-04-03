const StaffProfile = require("../models/StaffProfile.model");
const mongoose = require("mongoose");

// 🔷 CREATE
const createStaffProfile = (payload) => StaffProfile.create(payload);

// 🔷 FIND BY AUTH USER ID
const findStaffByAuthUserId = (authUserId) =>
  StaffProfile.findOne({ authUserId, isDeleted: { $ne: true } });

const findStaffById = (id) =>
  mongoose.Types.ObjectId.isValid(id)
    ? StaffProfile.findOne({ _id: id, isDeleted: { $ne: true } })
    : null;

// 🔷 FIND BY VENDOR (BASE)
const findStaffByVendor = (vendorAuthUserId) =>
  StaffProfile.find({
    vendorAuthUserId,
    isDeleted: { $ne: true },
  }).sort({ createdAt: -1 });

// 🔷 FIND BY VENDOR WITH FILTERS (NEW - OPTIONAL USE)
const findStaffByVendorWithFilters = async ({
  vendorAuthUserId,
  status,
  search,
}) => {
  const query = {
    vendorAuthUserId,
    isDeleted: { $ne: true },
  };

  if (status) {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
    ];
  }

  return StaffProfile.find(query).sort({ createdAt: -1 });
};

// 🔷 UPDATE
const updateStaffProfile = (authUserId, payload) =>
  StaffProfile.findOneAndUpdate(
    { authUserId, isDeleted: { $ne: true } },
    payload,
    { new: true },
  );

const updateStaffProfileById = (id, payload) =>
  StaffProfile.findOneAndUpdate(
    { _id: id, isDeleted: { $ne: true } },
    payload,
    { new: true },
  );

// 🔷 SOFT DELETE (FUTURE SAFE)
const softDeleteStaff = (authUserId) =>
  StaffProfile.findOneAndUpdate(
    { authUserId, isDeleted: { $ne: true } },
    { isDeleted: true },
    { new: true },
  );


module.exports = {
  createStaffProfile,
  findStaffById,
  findStaffByAuthUserId,
  findStaffByVendor,
  findStaffByVendorWithFilters, // NEW
  updateStaffProfile,
  updateStaffProfileById,
  softDeleteStaff, // NEW

};
