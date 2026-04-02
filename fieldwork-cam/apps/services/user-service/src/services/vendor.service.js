const {
  findByAuthUserId: findUserByAuthUserId,
  createUser,
  updateUser,
} = require("../repositories/user.repository");

const {
  createVendorProfile,
  findAllVendorProfiles,
  findVendorProfileById,
  findByAuthUserId: findVendorProfileByAuthUserId,
  updateVendorProfileByAuthUserId,
} = require("../repositories/vendor.repository");

const ApiError = require("../utils/apiError");

const buildDisplayNameParts = (fullName = "", meta = {}) => {
  const nameParts = String(fullName).trim().split(" ").filter(Boolean);
  return {
    firstName: meta.firstName || nameParts[0] || "",
    lastName: meta.lastName || nameParts.slice(1).join(" "),
  };
};

const formatVendorProfileResponse = (vendor, user) => {
  const meta = user?.meta || {};
  const fullName = user?.fullName || "";
  const { firstName, lastName } = buildDisplayNameParts(fullName, meta);
  const totalProjects = Number(meta.totalProjects ?? 0);
  const totalCompleted = Number(meta.totalCompleted ?? 0);
  const totalActiveProjects = Number(meta.totalActiveProjects ?? 0);
  const approvalRate = Number(meta.approvalRate ?? 0);
  const teamSize = Number(meta.teamSize ?? 0);

  return {
    _id: vendor._id,
    authUserId: vendor.authUserId || "",
    user: {
      authUserId: vendor.authUserId || "",
      fullName,
      email: user?.email || vendor.businessEmail || "",
      phone: user?.phone || vendor.businessPhone || "",
      role: user?.role || "VENDOR_OWNER",
      status: vendor.status || user?.status || "ACTIVE",
      createdAt: user?.createdAt || vendor.createdAt,
      lastLogin: user?.lastLogin || meta.lastLogin || "",
      profilePhotoUrl: user?.profilePhotoUrl || meta.profilePhotoUrl || "",
      location: user?.location || vendor.serviceArea || vendor.address || "",
      timezone: user?.timezone || meta.timezone || "",
      department: user?.department || meta.department || "Vendor Operations",
      jobTitle: user?.jobTitle || meta.jobTitle || "Vendor Partner",
      bio: user?.bio || meta.bio || "",
    },
    meta: {
      firstName,
      lastName,
      companyName: vendor.companyName || "",
      website: vendor.website || "",
      location: user?.location || vendor.serviceArea || vendor.address || "",
      timezone: user?.timezone || meta.timezone || "",
      department: user?.department || meta.department || "Vendor Operations",
      jobTitle: user?.jobTitle || meta.jobTitle || "Vendor Partner",
      bio: user?.bio || meta.bio || "",
      approvalRate,
      totalProjects,
      totalCompleted,
      totalActiveProjects,
      teamSize,
      profilePhotoUrl: user?.profilePhotoUrl || meta.profilePhotoUrl || "",
      memberSince: meta.memberSince || vendor.createdAt,
      lastLogin: user?.lastLogin || meta.lastLogin || "",
      address: vendor.address || "",
      serviceArea: vendor.serviceArea || "",
      serviceTypes: vendor.serviceTypes || [],
      businessEmail: vendor.businessEmail || user?.email || "",
      businessPhone: vendor.businessPhone || user?.phone || "",
      taxId: vendor.taxId || "",
      identityDocumentUrl: vendor.identityDocumentUrl || "",
    },
    quickInfo: [
      { label: "Company", value: vendor.companyName || "" },
      { label: "Website", value: vendor.website || "" },
      {
        label: "Location",
        value: user?.location || vendor.serviceArea || vendor.address || "",
      },
      {
        label: "Member Since",
        value: meta.memberSince || vendor.createdAt || null,
      },
      {
        label: "Team Size",
        value: teamSize > 0 ? `${teamSize} photographers` : "",
      },
    ],
    stats: {
      totalProjects,
      totalCompleted,
      totalActiveProjects,
      approvalRate,
    },
    recentProjects: Array.isArray(meta.recentProjects) ? meta.recentProjects : [],
    recentActivity: Array.isArray(meta.recentActivity) ? meta.recentActivity : [],
  };
};

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

  return formatVendorProfileResponse(vendor, user);
};

const updateVendorProfile = async (authUserId, payload) => {
  const vendor = await findVendorProfileByAuthUserId(authUserId);

  if (!vendor) {
    throw new ApiError("Vendor profile not found", 404);
  }

  const user = await findUserByAuthUserId(authUserId);

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  const nextMeta = {
    ...(user.meta || {}),
    ...(payload.meta || {}),
  };

  const updatedUser = await updateUser(authUserId, {
    fullName: payload.fullName ?? user.fullName,
    email: payload.email ?? user.email,
    phone: payload.phone ?? user.phone,
    location: payload.location ?? payload.serviceArea ?? user.location,
    timezone: payload.timezone ?? user.timezone,
    department: payload.department ?? user.department,
    jobTitle: payload.jobTitle ?? user.jobTitle,
    bio: payload.bio ?? user.bio,
    profilePhotoUrl: payload.profilePhotoUrl ?? user.profilePhotoUrl,
    meta: nextMeta,
  });
  const updatedVendor = await updateVendorProfileByAuthUserId(authUserId, {
    companyName: payload.companyName ?? vendor.companyName,
    businessEmail: payload.email ?? vendor.businessEmail,
    businessPhone: payload.phone ?? vendor.businessPhone,
    website: payload.website ?? vendor.website,
    address: payload.address ?? vendor.address,
    taxId: payload.taxId ?? vendor.taxId,
    identityDocumentUrl:
      payload.identityDocumentUrl ?? vendor.identityDocumentUrl,
    serviceArea: payload.serviceArea ?? vendor.serviceArea,
    serviceTypes: payload.serviceTypes ?? vendor.serviceTypes,
  });

  return formatVendorProfileResponse(updatedVendor, updatedUser);
};

const createVendorByAdmin = async (adminAuthUserId, payload) => {
  const adminUser = await findUserByAuthUserId(adminAuthUserId);

  if (!adminUser || adminUser.role !== "ADMIN") {
    throw new ApiError("Only admin can create vendors", 403);
  }

  if (!payload.authUserId) {
    throw new ApiError("Auth user id is required", 400);
  }

  const existingUser = await findUserByAuthUserId(payload.authUserId);
  const existingVendor = await findVendorProfileByAuthUserId(payload.authUserId);

  const userPayload = {
    authUserId: payload.authUserId,
    phone: payload.phone,
    fullName: payload.fullName,
    email: payload.email,
    role: "VENDOR_OWNER",
    isVerified: false,
    status: "ACTIVE",
  };

  const vendorPayload = {
    authUserId: payload.authUserId,
    companyName: payload.companyName,
    businessEmail: payload.email,
    businessPhone: payload.phone || "",
    address: payload.address || "",
    taxId: payload.taxId || "",
    identityDocumentUrl: payload.identityDocumentUrl || "",
    serviceArea: payload.serviceArea || "",
    serviceTypes: payload.serviceTypes || [],
    website: payload.website || "",
    profileCompleted: true,
    status: "ACTIVE",
  };

  const user = existingUser
    ? await updateUser(payload.authUserId, userPayload)
    : await createUser(userPayload);

  const vendorProfile = existingVendor
    ? await updateVendorProfileByAuthUserId(payload.authUserId, vendorPayload)
    : await createVendorProfile(vendorPayload);

  return {
    user,
    vendorProfile,
  };
};

module.exports = {
  getVendors,
  getVendorById,
  getVendorProfileByAuthUserId,
  updateVendorProfile,
  createVendorByAdmin,
};
