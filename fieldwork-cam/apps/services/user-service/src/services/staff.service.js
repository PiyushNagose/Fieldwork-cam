const {
  createUser,
  findByAuthUserId,
  findUserByEmail,
} = require("../repositories/user.repository");

const {
  createStaffProfile,
  findStaffByVendor,
  findStaffByAuthUserId,
  updateStaffProfile,
} = require("../repositories/staff.repository");

const ApiError = require("../utils/apiError");

// 🔷 CREATE STAFF
const createStaff = async (vendorAuthUserId, payload) => {
  const vendorUser = await findByAuthUserId(vendorAuthUserId);

  if (!vendorUser || vendorUser.role !== "VENDOR_OWNER") {
    throw new ApiError("Only vendors can add staff", 403);
  }

  const authUserId = `staff_${Date.now()}`;

  let user = await findUserByEmail(payload.email);

  if (!user) {
    const authUserId = `staff_${Date.now()}`;

    user = await createUser({
      authUserId,
      fullName: payload.fullName,
      phone: payload.phone,
      email: payload.email,
      role: "STAFF",
      isVerified: false,
    });
  }

  const existing = await findStaffByAuthUserId(user.authUserId);

  if (existing) {
    throw new ApiError("Staff already exists for this vendor", 400);
  }

  // use existing user.authUserId
  const staffProfile = await createStaffProfile({
    authUserId: user.authUserId,
    vendorAuthUserId,
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    location: payload.location,
    profilePhotoUrl: payload.profilePhotoUrl,
    roleTitle: payload.roleTitle,
    inviteMethod: payload.inviteMethod || "SMS",
    status: payload.status || "ACTIVE",
    specialties: payload.specialties || [],
    assignedProjectIds: [],
  });
  return { user, staffProfile };
};

// 🔷 GET TEAM (FILTER + SEARCH)
const getVendorTeam = async (vendorAuthUserId, query = {}) => {
  const vendorUser = await findByAuthUserId(vendorAuthUserId);

  if (!vendorUser || vendorUser.role !== "VENDOR_OWNER") {
    throw new ApiError("Only vendors can view team", 403);
  }

  const { status, search } = query;

  let staffList = await findStaffByVendor(vendorAuthUserId);

  if (status) {
    staffList = staffList.filter((s) => s.status === status);
  }

  if (search) {
    const q = search.toLowerCase();
    staffList = staffList.filter(
      (s) =>
        s.fullName?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.location?.toLowerCase().includes(q),
    );
  }

  return staffList;
};

// 🔷 GET STAFF DETAILS
const getStaffDetails = async (vendorAuthUserId, staffAuthUserId) => {
  const vendorUser = await findByAuthUserId(vendorAuthUserId);

  if (!vendorUser || vendorUser.role !== "VENDOR_OWNER") {
    throw new ApiError("Only vendors can view staff", 403);
  }

  const staff = await findStaffByAuthUserIdParam(staffAuthUserId);

  if (!staff) {
    throw new ApiError("Staff member not found", 404);
  }

  if (staff.vendorAuthUserId !== vendorAuthUserId) {
    throw new ApiError("Unauthorized staff access", 403);
  }

  return staff;
};

// 🔷 ASSIGN PROJECT
const assignProjectToStaff = async (
  vendorAuthUserId,
  staffAuthUserId,
  projectId,
) => {
  const staff = await findStaffByAuthUserIdParam(staffAuthUserId);

  if (!staff) {
    throw new ApiError("Staff member not found", 404);
  }

  if (staff.vendorAuthUserId !== vendorAuthUserId) {
    throw new ApiError("Unauthorized staff access", 403);
  }

  const nextIds = staff.assignedProjectIds.includes(projectId)
    ? staff.assignedProjectIds
    : [...staff.assignedProjectIds, projectId];

  return updateStaffProfile(staffAuthUserId, {
    assignedProjectIds: nextIds,
  });
};

// 🔷 UPDATE STATUS (NEW)
const updateStaffStatus = async (vendorAuthUserId, staffAuthUserId, status) => {
  const staff = await findStaffByAuthUserIdParam(staffAuthUserId);

  if (!staff) {
    throw new ApiError("Staff member not found", 404);
  }

  if (staff.vendorAuthUserId !== vendorAuthUserId) {
    throw new ApiError("Unauthorized", 403);
  }

  return updateStaffProfile(staffAuthUserId, { status });
};

// 🔷 STAFF STATS (NEW)
const getStaffStats = async (vendorAuthUserId) => {
  const staff = await findStaffByVendor(vendorAuthUserId);

  const total = staff.length;
  const active = staff.filter((s) => s.status === "ACTIVE").length;
  const onLeave = staff.filter((s) => s.status === "ON_LEAVE").length;

  return {
    total,
    active,
    onLeave,
    inactive: total - active - onLeave,
  };
};

module.exports = {
  createStaff,
  getVendorTeam,
  getStaffDetails,
  assignProjectToStaff,
  updateStaffStatus,
  getStaffStats,
};
