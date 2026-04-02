const axios = require("axios");
const env = require("../config/env");

const {
  findByAuthUserId: findUserByAuthUserId,
  createUser,
} = require("../repositories/user.repository");

const {
  createVendorProfile,
  findAllVendorProfiles,
  findVendorProfileById,
  findByAuthUserId: findVendorProfileByAuthUserId,
} = require("../repositories/vendor.repository");

const ApiError = require("../utils/apiError");

const getVendors = async (query = {}) => {
  const profiles = await findAllVendorProfiles();

  const vendors = await Promise.all(
    profiles.map(async (item) => {
      const user = await findUserByAuthUserId(item.authUserId);

      return {
        _id: item._id,
        authUserId: item.authUserId || "",
        companyName: item.companyName || "",
        fullName: user?.fullName || "",
        email: user?.email || item.businessEmail || "",
        phone: user?.phone || item.businessPhone || "",
        serviceArea: item.serviceArea || item.address || "",
        address: item.address || "",
        status: item.status || user?.status || "ACTIVE",
        joinedAt: item.createdAt,
        serviceTypes: item.serviceTypes || [],
        completedProjects: 0,
        approvalRate: 0,
        activeProjects: 0,
        rating: 0,
        monthlyGrowth: 0,
      };
    }),
  );

  const normalizedSearch = String(query.search || "")
    .trim()
    .toLowerCase();

  let filtered = vendors;

  if (query.status) {
    filtered = filtered.filter(
      (item) =>
        String(item.status || "").toUpperCase() ===
        String(query.status || "").toUpperCase(),
    );
  }

  if (query.serviceArea) {
    filtered = filtered.filter((item) =>
      String(item.serviceArea || "")
        .toLowerCase()
        .includes(String(query.serviceArea || "").toLowerCase()),
    );
  }

  if (query.companyName) {
    filtered = filtered.filter((item) =>
      String(item.companyName || "")
        .toLowerCase()
        .includes(String(query.companyName || "").toLowerCase()),
    );
  }

  if (query.serviceType) {
    filtered = filtered.filter((item) =>
      Array.isArray(item.serviceTypes)
        ? item.serviceTypes.some(
            (type) =>
              String(type || "").toLowerCase() ===
              String(query.serviceType || "").toLowerCase(),
          )
        : false,
    );
  }

  if (normalizedSearch) {
    filtered = filtered.filter((item) =>
      [
        item.companyName,
        item.fullName,
        item.email,
        item.phone,
        item.serviceArea,
        item.address,
        ...(item.serviceTypes || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }

  return filtered;
};

const getVendorById = async (id) => {
  const vendor = await findVendorProfileById(id);

  if (!vendor) {
    throw new ApiError("Vendor not found", 404);
  }

  const user = await findUserByAuthUserId(vendor.authUserId);

  return {
    _id: vendor._id,
    authUserId: vendor.authUserId || "",
    companyName: vendor.companyName || "",
    fullName: user?.fullName || "",
    email: user?.email || vendor.businessEmail || "",
    phone: user?.phone || vendor.businessPhone || "",
    serviceArea: vendor.serviceArea || vendor.address || "",
    address: vendor.address || "",
    status: vendor.status || user?.status || "ACTIVE",
    joinedAt: vendor.createdAt,
    serviceTypes: vendor.serviceTypes || [],
    bio: user?.bio || "",
    website: vendor.website || "",
    teamSize: 0,
    totalProjects: 0,
    completedProjects: 0,
    activeProjects: 0,
    rating: 0,
    recentProjects: [],
    recentActivity: [],
  };
};

const getVendorProfileByAuthUserId = async (authUserId) => {
  const vendor = await findVendorProfileByAuthUserId(authUserId);

  if (!vendor) {
    throw new ApiError("Vendor profile not found", 404);
  }

  const user = await findUserByAuthUserId(authUserId);

  return {
    _id: vendor._id,
    authUserId: vendor.authUserId || "",
    user: {
      authUserId: vendor.authUserId || "",
      fullName: user?.fullName || "",
      email: user?.email || vendor.businessEmail || "",
      phone: user?.phone || vendor.businessPhone || "",
      role: user?.role || "VENDOR_OWNER",
      status: vendor.status || user?.status || "ACTIVE",
      createdAt: user?.createdAt || vendor.createdAt,
      lastLogin: user?.lastLogin || "",
      profilePhotoUrl: user?.profilePhotoUrl || "",
      location: vendor.serviceArea || vendor.address || "",
      timezone: user?.timezone || "",
      department: "Vendor Operations",
      jobTitle: user?.jobTitle || "Vendor Partner",
      bio: user?.bio || "",
    },
    meta: {
      location: vendor.serviceArea || vendor.address || "",
      timezone: user?.timezone || "",
      department: "Vendor Operations",
      jobTitle: user?.jobTitle || "Vendor Partner",
      bio: user?.bio || "",
      approvalRate: 0,
      totalProjects: 0,
      totalCompleted: 0,
      totalActiveProjects: 0,
      profilePhotoUrl: user?.profilePhotoUrl || "",
      memberSince: vendor.createdAt,
      lastLogin: user?.lastLogin || "",
    },
    recentActivity: [],
  };
};

const createVendorByAdmin = async (adminAuthUserId, payload) => {
  const adminUser = await findUserByAuthUserId(adminAuthUserId);

  if (!adminUser || adminUser.role !== "ADMIN") {
    throw new ApiError("Only admin can create vendors", 403);
  }

  if (!env.AUTH_SERVICE_URL) {
    throw new ApiError("AUTH_SERVICE_URL not configured", 500);
  }

  let authUser;
  let inviteLink;

  try {
    const authRes = await axios.post(
      `${env.AUTH_SERVICE_URL}/auth/invite-user`,
      {
        phone: payload.phone,
        email: payload.email,
        role: "VENDOR_OWNER",
      },
    );

    authUser = authRes.data?.data?.authUser;
    inviteLink = authRes.data?.data?.inviteLink;
  } catch (error) {
    console.error("Auth Service Error:", error.response?.data || error.message);
    throw new ApiError("Failed to create auth user", 500);
  }

  if (!authUser?._id) {
    throw new ApiError("Invalid auth user response", 500);
  }

  const user = await createUser({
    authUserId: authUser._id,
    phone: payload.phone,
    fullName: payload.fullName,
    email: payload.email,
    role: "VENDOR_OWNER",
    isVerified: false,
    status: "ACTIVE",
  });

  const vendorProfile = await createVendorProfile({
    authUserId: authUser._id,
    companyName: payload.companyName,
    businessEmail: payload.email,
    businessPhone: payload.phone || "",
    address: payload.address || "",
    taxId: payload.taxId || "",
    identityDocumentUrl: payload.identityDocumentUrl || "",
    serviceArea: payload.serviceArea || "",
    serviceTypes: payload.serviceTypes || [],
    profileCompleted: true,
    status: "ACTIVE",
  });

  return {
    user,
    vendorProfile,
    inviteLink,
  };
};

module.exports = {
  getVendors,
  getVendorById,
  getVendorProfileByAuthUserId,
  createVendorByAdmin,
};
