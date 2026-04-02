const {
  findByAuthUserId,
  createUser,
  updateUser,
} = require("../repositories/user.repository");
const { createStaffProfile } = require("../repositories/staff.repository");
const {
  findByAuthUserId: findVendorByAuthUserId,
} = require("../repositories/vendor.repository");
const { publishEvent } = require("./publisher.service");
const ApiError = require("../utils/apiError");

const ROUTING_KEYS = {
  USER_PROFILE_CREATED: "user.profile.created",
};

const ensureUserFromAuthEvent = async (payload) => {
  const { authUserId, phone, role, isVerified } = payload;

  const existingUser = await findByAuthUserId(authUserId);

  if (existingUser) {
    return updateUser(authUserId, {
      phone,
      role,
      isVerified,
    });
  }

  const user = await createUser({
    authUserId,
    phone,
    role,
    isVerified,
  });

  if (role === "STAFF") {
    await createStaffProfile({
      authUserId,
      vendorAuthUserId: "",
      status: "ACTIVE",
      assignedProjectIds: [],
    });
  }

  await publishEvent(ROUTING_KEYS.USER_PROFILE_CREATED, {
    userId: user.authUserId,
    authUserId: user.authUserId,
    phone: user.phone,
    role: user.role,
    timestamp: new Date().toISOString(),
  });

  return user;
};

const getProfile = async (authUserId) => {
  const user = await findByAuthUserId(authUserId);

  if (!user) return null;

  const vendorProfile = await findVendorByAuthUserId(authUserId);

  return {
    user,
    vendorProfile,
    profileCompleted: !!vendorProfile,
  };
};

const updateProfile = async (authUserId, payload) => {
  const user = await findByAuthUserId(authUserId);

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  const updatedUser = await updateUser(authUserId, {
    fullName: payload.fullName ?? user.fullName,
    email: payload.email ?? user.email,
    phone: payload.phone ?? user.phone,
    location: payload.location ?? user.location,
    timezone: payload.timezone ?? user.timezone,
    department: payload.department ?? user.department,
    jobTitle: payload.jobTitle ?? user.jobTitle,
    bio: payload.bio ?? user.bio,
    profilePhotoUrl: payload.profilePhotoUrl ?? user.profilePhotoUrl,
    meta: {
      ...(user.meta || {}),
      ...(payload.meta || {}),
    },
  });

  return {
    user: updatedUser,
  };
};

module.exports = {
  ensureUserFromAuthEvent,
  getProfile,
  updateProfile,
};
