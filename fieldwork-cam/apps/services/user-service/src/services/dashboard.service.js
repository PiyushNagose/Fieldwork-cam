const { findByAuthUserId } = require("../repositories/user.repository");
const {
  findByAuthUserId: findVendorByAuthUserId,
} = require("../repositories/vendor.repository");
const ApiError = require("../utils/apiError");

const getDashboardData = async (authUserId) => {
  const user = await findByAuthUserId(authUserId);

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  const vendorProfile = await findVendorByAuthUserId(authUserId);

  const profileCompleted = !!vendorProfile;

  return {
    profileCompleted,
    vendor: {
      id: user.authUserId,
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "",
      companyName: vendorProfile?.companyName || "",
      serviceArea: vendorProfile?.serviceArea || "",
      serviceTypes: vendorProfile?.serviceTypes || [],
      identityDocumentUrl: vendorProfile?.identityDocumentUrl || "",
    },
    stats: {
      activeProjects: 0,
      completedProjects: 0,
      pendingApprovals: 0,
      earningsThisMonth: 0,
      unreadNotifications: 0,
    },
    sections: {
      recentProjects: [],
      upcomingDeadlines: [],
      recentNotifications: [],
      recentPayments: [],
    },
  };
};

module.exports = {
  getDashboardData,
};
