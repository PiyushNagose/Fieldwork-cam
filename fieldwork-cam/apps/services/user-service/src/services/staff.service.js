const {
  createUser,
  findByAuthUserId,
  findUserByEmail,
  updateUser,
} = require("../repositories/user.repository");

const {
  createStaffProfile,
  findStaffByVendor,
  findStaffByAuthUserId,
  updateStaffProfile,
} = require("../repositories/staff.repository");

const ApiError = require("../utils/apiError");

const normalizeStatus = (value = "") => {
  const status = String(value || "").toUpperCase().replace(/\s+/g, "_");
  return ["ACTIVE", "INACTIVE", "ON_LEAVE"].includes(status)
    ? status
    : "ACTIVE";
};

const formatStaff = (staff, user = null) => {
  const assignedProjectIds = Array.isArray(staff.assignedProjectIds)
    ? staff.assignedProjectIds
    : [];

  return {
    _id: staff._id,
    authUserId: staff.authUserId,
    vendorAuthUserId: staff.vendorAuthUserId,
    fullName: staff.fullName || user?.fullName || "",
    email: staff.email || user?.email || "",
    phone: staff.phone || user?.phone || "",
    location: staff.location || user?.location || "",
    profilePhotoUrl: staff.profilePhotoUrl || user?.profilePhotoUrl || "",
    roleTitle: staff.roleTitle || user?.jobTitle || "",
    inviteMethod: staff.inviteMethod || "SMS",
    status: normalizeStatus(staff.status),
    specialties: Array.isArray(staff.specialties) ? staff.specialties : [],
    assignedProjectIds,
    activeAssignments: assignedProjectIds.length,
    completedJobs: Number(staff.completedJobs || 0),
    rating: Number(staff.rating || 0),
    lastActiveAt: staff.lastActiveAt || staff.updatedAt || staff.createdAt,
    createdAt: staff.createdAt,
    updatedAt: staff.updatedAt,
  };
};

const ensureVendorOwner = async (vendorAuthUserId) => {
  const vendorUser = await findByAuthUserId(vendorAuthUserId);

  if (!vendorUser || vendorUser.role !== "VENDOR_OWNER") {
    throw new ApiError("Only vendors can manage staff", 403);
  }

  return vendorUser;
};

const createStaff = async (vendorAuthUserId, payload) => {
  await ensureVendorOwner(vendorAuthUserId);

  let user = await findUserByEmail(payload.email);

  if (!user) {
    user = await createUser({
      authUserId: `staff_${Date.now()}`,
      fullName: payload.fullName,
      phone: payload.phone,
      email: payload.email,
      role: "STAFF",
      isVerified: false,
      status: normalizeStatus(payload.status),
      location: payload.location || "",
      profilePhotoUrl: payload.profilePhotoUrl || "",
      jobTitle: payload.roleTitle || "",
    });
  } else {
    user = await updateUser(user.authUserId, {
      fullName: payload.fullName ?? user.fullName,
      phone: payload.phone ?? user.phone,
      email: payload.email ?? user.email,
      location: payload.location ?? user.location,
      profilePhotoUrl: payload.profilePhotoUrl ?? user.profilePhotoUrl,
      jobTitle: payload.roleTitle ?? user.jobTitle,
      status: normalizeStatus(payload.status || user.status),
    });
  }

  const existing = await findStaffByAuthUserId(user.authUserId);

  if (existing) {
    throw new ApiError("Staff already exists for this vendor", 400);
  }

  const staffProfile = await createStaffProfile({
    authUserId: user.authUserId,
    vendorAuthUserId,
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    location: payload.location || "",
    profilePhotoUrl: payload.profilePhotoUrl || "",
    roleTitle: payload.roleTitle,
    inviteMethod: payload.inviteMethod || "EMAIL",
    status: normalizeStatus(payload.status),
    specialties: payload.specialties || [],
    assignedProjectIds: [],
    completedJobs: 0,
    rating: 0,
    lastActiveAt: new Date(),
  });

  return formatStaff(staffProfile, user);
};

const getVendorTeam = async (vendorAuthUserId, query = {}) => {
  await ensureVendorOwner(vendorAuthUserId);

  const { status, search } = query;
  const normalizedStatus = status ? normalizeStatus(status) : "";
  let staffList = await findStaffByVendor(vendorAuthUserId);

  if (normalizedStatus) {
    staffList = staffList.filter((item) => item.status === normalizedStatus);
  }

  if (search) {
    const q = String(search).toLowerCase();
    staffList = staffList.filter(
      (item) =>
        item.fullName?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q) ||
        item.authUserId?.toLowerCase().includes(q) ||
        item.roleTitle?.toLowerCase().includes(q),
    );
  }

  return staffList.map((item) => formatStaff(item));
};

const getStaffDetails = async (vendorAuthUserId, staffAuthUserId) => {
  await ensureVendorOwner(vendorAuthUserId);

  const staff = await findStaffByAuthUserId(staffAuthUserId);

  if (!staff) {
    throw new ApiError("Staff member not found", 404);
  }

  if (staff.vendorAuthUserId !== vendorAuthUserId) {
    throw new ApiError("Unauthorized staff access", 403);
  }

  return formatStaff(staff);
};

const assignProjectToStaff = async (
  vendorAuthUserId,
  staffAuthUserId,
  projectId,
) => {
  const staff = await findStaffByAuthUserId(staffAuthUserId);

  if (!staff) {
    throw new ApiError("Staff member not found", 404);
  }

  if (staff.vendorAuthUserId !== vendorAuthUserId) {
    throw new ApiError("Unauthorized staff access", 403);
  }

  const currentIds = Array.isArray(staff.assignedProjectIds)
    ? staff.assignedProjectIds
    : [];
  const nextIds = currentIds.includes(projectId)
    ? currentIds
    : [...currentIds, projectId];

  const updated = await updateStaffProfile(staffAuthUserId, {
    assignedProjectIds: nextIds,
    lastActiveAt: new Date(),
  });

  return formatStaff(updated);
};

const updateStaffStatus = async (vendorAuthUserId, staffAuthUserId, status) => {
  const staff = await findStaffByAuthUserId(staffAuthUserId);

  if (!staff) {
    throw new ApiError("Staff member not found", 404);
  }

  if (staff.vendorAuthUserId !== vendorAuthUserId) {
    throw new ApiError("Unauthorized", 403);
  }

  const updated = await updateStaffProfile(staffAuthUserId, {
    status: normalizeStatus(status),
    lastActiveAt: new Date(),
  });

  return formatStaff(updated);
};

const getStaffStats = async (vendorAuthUserId) => {
  const staff = await findStaffByVendor(vendorAuthUserId);

  const total = staff.length;
  const active = staff.filter((item) => item.status === "ACTIVE").length;
  const onLeave = staff.filter((item) => item.status === "ON_LEAVE").length;
  const activeProjects = staff.reduce(
    (sum, item) =>
      sum +
      (Array.isArray(item.assignedProjectIds) ? item.assignedProjectIds.length : 0),
    0,
  );
  const ratings = staff
    .map((item) => Number(item.rating || 0))
    .filter((value) => value > 0);
  const avgRating = ratings.length
    ? Number(
        (ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1),
      )
    : 0;

  return {
    total,
    active,
    onLeave,
    inactive: total - active - onLeave,
    activeProjects,
    avgRating,
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
