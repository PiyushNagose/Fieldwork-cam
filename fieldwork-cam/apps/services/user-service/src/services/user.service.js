const {
  findByAuthUserId,
  createUser,
  updateUser,
  findUserByEmail,
} = require("../repositories/user.repository");
const { createStaffProfile } = require("../repositories/staff.repository");
const {
  findByAuthUserId: findVendorByAuthUserId,
} = require("../repositories/vendor.repository");
const {
  findStaffByAuthUserId,
} = require("../repositories/staff.repository");
const { publishEvent } = require("./publisher.service");
const ApiError = require("../utils/apiError");
const { saveDataUrlImage } = require("../utils/profileMediaStorage");

const ROUTING_KEYS = {
  USER_PROFILE_CREATED: "user.profile.created",
};

const ensureLocalUserRecord = async (authPayload = {}) => {
  const authUserId = authPayload?.userId || authPayload?.authUserId || "";

  if (!authUserId) {
    throw new ApiError("Unauthorized", 401);
  }

  const existingUser = await findByAuthUserId(authUserId);

  if (existingUser) {
    return existingUser;
  }

  const existingUserByEmail = authPayload?.email
    ? await findUserByEmail(authPayload.email)
    : null;

  if (existingUserByEmail) {
    return updateUser(existingUserByEmail.authUserId, {
      authUserId,
      phone: authPayload?.phone || existingUserByEmail.phone,
      fullName: authPayload?.fullName || existingUserByEmail.fullName,
      email: authPayload?.email || existingUserByEmail.email,
      role: authPayload?.role || existingUserByEmail.role,
      isVerified: true,
      status: existingUserByEmail.status || "ACTIVE",
    });
  }

  return createUser({
    authUserId,
    phone: authPayload?.phone || "",
    fullName: authPayload?.fullName || "",
    email: authPayload?.email || "",
    role: authPayload?.role || "VENDOR_OWNER",
    isVerified: true,
    status: "ACTIVE",
  });
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

const getProfile = async (authPayload) => {
  const authUserId = authPayload?.userId || authPayload?.authUserId || authPayload;
  const user =
    typeof authPayload === "object"
      ? await ensureLocalUserRecord(authPayload)
      : await findByAuthUserId(authUserId);

  if (!user) {
    return null;
  }

  const vendorProfile = await findVendorByAuthUserId(authUserId);
  const staffProfile = await findStaffByAuthUserId(authUserId);

  return {
    user,
    vendorProfile,
    staffProfile,
    profileCompleted: !!vendorProfile || !!staffProfile,
  };
};

const updateProfile = async (authPayload, payload) => {
  const authUserId = authPayload?.userId || authPayload?.authUserId || authPayload;
  const user =
    typeof authPayload === "object"
      ? await ensureLocalUserRecord(authPayload)
      : await findByAuthUserId(authUserId);

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  const profilePhotoUrl =
    payload.profilePhotoDataUrl && payload.publicBaseUrl
      ? saveDataUrlImage({
          dataUrl: payload.profilePhotoDataUrl,
          prefix: `profile-${authUserId}`,
          publicBaseUrl: payload.publicBaseUrl,
        })
      : payload.profilePhotoUrl ?? user.profilePhotoUrl;

  const bannerImageUrl =
    payload.bannerImageDataUrl && payload.publicBaseUrl
      ? saveDataUrlImage({
          dataUrl: payload.bannerImageDataUrl,
          prefix: `banner-${authUserId}`,
          publicBaseUrl: payload.publicBaseUrl,
        })
      : payload.bannerImageUrl ?? user.bannerImageUrl;

  const updatedUser = await updateUser(authUserId, {
    fullName: payload.fullName ?? user.fullName,
    email: payload.email ?? user.email,
    phone: payload.phone ?? user.phone,
    location: payload.location ?? user.location,
    timezone: payload.timezone ?? user.timezone,
    department: payload.department ?? user.department,
    jobTitle: payload.jobTitle ?? user.jobTitle,
    bio: payload.bio ?? user.bio,
    profilePhotoUrl,
    bannerImageUrl,
    meta: {
      ...(user.meta || {}),
      ...(payload.meta || {}),
      profilePhotoUrl,
      bannerImageUrl,
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
