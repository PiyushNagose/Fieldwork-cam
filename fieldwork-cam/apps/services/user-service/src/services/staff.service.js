const axios = require("axios");
const env = require("../config/env");
const {
  createUser,
  findByAuthUserId,
  findUserByEmail,
  updateUser,
} = require("../repositories/user.repository");

const {
  createStaffProfile,
  findStaffById,
  findStaffByVendor,
  findStaffByAuthUserId,
  updateStaffProfile,
  updateStaffProfileById,
  softDeleteStaff,
} = require("../repositories/staff.repository");

const ApiError = require("../utils/apiError");

const normalizeStatus = (value = "") => {
  const status = String(value || "").toUpperCase().replace(/\s+/g, "_");
  return ["ACTIVE", "INACTIVE", "ON_LEAVE"].includes(status)
    ? status
    : "ACTIVE";
};

const normalizeInviteMethod = (value = "") => {
  const method = String(value || "").toUpperCase().trim();
  return ["SMS", "EMAIL"].includes(method) ? method : "EMAIL";
};

const formatStaff = (staff, user = null, meta = {}) => {
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
    inviteMethod: normalizeInviteMethod(staff.inviteMethod),
    status: normalizeStatus(staff.status),
    specialties: Array.isArray(staff.specialties) ? staff.specialties : [],
    assignedProjectIds,
    activeAssignments: assignedProjectIds.length,
    completedJobs: Number(staff.completedJobs || 0),
    rating: Number(staff.rating || 0),
    lastActiveAt: staff.lastActiveAt || staff.updatedAt || staff.createdAt,
    createdAt: staff.createdAt,
    updatedAt: staff.updatedAt,
    inviteLink: meta.inviteLink || "",
    emailDelivery: meta.emailDelivery || null,
  };
};

const resolveStaffForVendor = async (vendorAuthUserId, staffIdentifier) => {
  const staff =
    (await findStaffByAuthUserId(staffIdentifier)) ||
    (await findStaffById(staffIdentifier));

  if (!staff) {
    throw new ApiError("Staff member not found", 404);
  }

  if (staff.vendorAuthUserId !== vendorAuthUserId) {
    throw new ApiError("Unauthorized staff access", 403);
  }

  return staff;
};

const ensureVendorOwner = async (vendorAuthUserId) => {
  const vendorUser = await findByAuthUserId(vendorAuthUserId);

  if (!vendorUser || vendorUser.role !== "VENDOR_OWNER") {
    throw new ApiError("Only vendors can manage staff", 403);
  }

  return vendorUser;
};

const inviteStaffAuthUser = async (payload) => {
  if (!env.AUTH_SERVICE_URL) {
    throw new ApiError("AUTH_SERVICE_URL not configured", 500);
  }

  try {
    const authRes = await axios.post(`${env.AUTH_SERVICE_URL}/auth/invite-user`, {
      phone: payload.phone,
      email: payload.email,
      role: "STAFF",
      inviteBaseUrl: payload.inviteBaseUrl,
      fullName: payload.fullName,
      companyName: payload.vendorCompanyName || "",
    });

    return authRes.data?.data || authRes.data || {};
  } catch (error) {
    throw new ApiError(
      error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to create staff auth invite",
      error?.response?.status || 500,
    );
  }
};

const createStaff = async (vendorAuthUserId, payload) => {
  const vendorUser = await ensureVendorOwner(vendorAuthUserId);
  const inviteData = await inviteStaffAuthUser({
    ...payload,
    vendorCompanyName: vendorUser.fullName || "",
  });

  const authUser =
    inviteData?.authUser ||
    inviteData?.user ||
    null;

  const authUserId = authUser?._id || authUser?.id;

  if (!authUserId) {
    throw new ApiError("Invalid auth user response for staff invite", 500);
  }

  const existingUserByAuthId = await findByAuthUserId(authUserId);
  const existingUserByEmail = await findUserByEmail(payload.email);
  let user = existingUserByAuthId || existingUserByEmail || null;

  const userPayload = {
    authUserId,
    fullName: payload.fullName,
    phone: payload.phone,
    email: payload.email,
    role: "STAFF",
    isVerified: false,
    status: normalizeStatus(payload.status),
    location: payload.location || "",
    profilePhotoUrl: payload.profilePhotoUrl || "",
    jobTitle: payload.roleTitle || "",
  };

  if (!user) {
    user = await createUser(userPayload);
  } else if (user.authUserId !== authUserId && existingUserByEmail) {
    throw new ApiError("A staff member already exists with this email", 400);
  } else {
    user = await updateUser(user.authUserId, userPayload);
  }

  const existing = await findStaffByAuthUserId(authUserId);

  if (existing) {
    if (existing.vendorAuthUserId !== vendorAuthUserId) {
      throw new ApiError("Staff already exists for another vendor", 400);
    }

    throw new ApiError("Staff already exists for this vendor", 400);
  }

  const staffProfile = await createStaffProfile({
    authUserId,
    vendorAuthUserId,
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    location: payload.location || "",
    profilePhotoUrl: payload.profilePhotoUrl || "",
    roleTitle: payload.roleTitle,
    inviteMethod: normalizeInviteMethod(payload.inviteMethod),
    status: normalizeStatus(payload.status),
    specialties: payload.specialties || [],
    assignedProjectIds: [],
    completedJobs: 0,
    rating: 0,
    lastActiveAt: new Date(),
  });

  return formatStaff(staffProfile, user, {
    inviteLink: inviteData?.inviteLink || "",
    emailDelivery: inviteData?.emailDelivery || null,
  });
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
  const staff = await resolveStaffForVendor(vendorAuthUserId, staffAuthUserId);

  return formatStaff(staff);
};

const assignProjectToStaff = async (
  vendorAuthUserId,
  staffAuthUserId,
  projectId,
) => {
  const staff = await resolveStaffForVendor(vendorAuthUserId, staffAuthUserId);

  const currentIds = Array.isArray(staff.assignedProjectIds)
    ? staff.assignedProjectIds
    : [];
  const nextIds = currentIds.includes(projectId)
    ? currentIds
    : [...currentIds, projectId];

  const updated = await updateStaffProfileById(staff._id, {
    assignedProjectIds: nextIds,
    lastActiveAt: new Date(),
  });

  return formatStaff(updated);
};

const updateStaffStatus = async (vendorAuthUserId, staffAuthUserId, status) => {
  const staff = await resolveStaffForVendor(vendorAuthUserId, staffAuthUserId);

  const updated = await updateStaffProfileById(staff._id, {
    status: normalizeStatus(status),
    lastActiveAt: new Date(),
  });

  return formatStaff(updated);
};

const updateStaff = async (vendorAuthUserId, staffIdentifier, payload) => {
  const staff = await resolveStaffForVendor(vendorAuthUserId, staffIdentifier);

  const userPayload = {
    fullName: payload.fullName,
    phone: payload.phone,
    email: payload.email,
    location: payload.location || "",
    profilePhotoUrl: payload.profilePhotoUrl || "",
    jobTitle: payload.roleTitle || "",
    status: normalizeStatus(payload.status || staff.status),
  };

  const updatedUser = await updateUser(staff.authUserId, userPayload);
  const updatedStaff = await updateStaffProfileById(staff._id, {
    fullName: payload.fullName,
    phone: payload.phone,
    email: payload.email,
    location: payload.location || "",
    profilePhotoUrl: payload.profilePhotoUrl || "",
    roleTitle: payload.roleTitle || "",
    status: normalizeStatus(payload.status || staff.status),
    specialties: Array.isArray(payload.specialties)
      ? payload.specialties
      : staff.specialties || [],
    lastActiveAt: new Date(),
  });

  return formatStaff(updatedStaff, updatedUser);
};

const removeStaff = async (vendorAuthUserId, staffIdentifier) => {
  const staff = await resolveStaffForVendor(vendorAuthUserId, staffIdentifier);

  await updateUser(staff.authUserId, {
    status: "INACTIVE",
  });

  const removed = await softDeleteStaff(staff.authUserId);
  return formatStaff(removed);
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
  updateStaff,
  updateStaffStatus,
  removeStaff,
  getStaffStats,
};
