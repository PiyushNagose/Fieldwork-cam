const Report = require("../models/Report.model");

const getPerformanceSummaryService = async (vendorAuthUserId) => {
  const reports = await Report.find({ vendorAuthUserId });

  const totalProjects = reports.length;
  const completedProjects = reports.filter(
    (item) => item.status === "Completed"
  ).length;

  const averageAiScore = totalProjects
    ? Math.round(
        reports.reduce(
          (sum, item) => sum + (item.summary?.aiQualityScore || 0),
          0
        ) / totalProjects
      )
    : 0;

  const approvalRate = totalProjects
    ? Math.round((completedProjects / totalProjects) * 100)
    : 0;

  const completionRate = approvalRate;

  const totalCategoriesCaptured = reports.reduce(
    (sum, item) => sum + (item.summary?.totalCategories || 0),
    0
  );

  const recentActivity = reports
    .slice()
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5)
    .map((item) => ({
      id: item._id,
      title: item.workOrderNumber,
      status: item.status,
      updatedAt: item.updatedAt,
      aiQualityScore: item.summary?.aiQualityScore || 0,
    }));

  return {
    totalProjects,
    completedProjects,
    completionRate,
    approvalRate,
    averageAiScore,
    totalReports: reports.length,
    totalCategoriesCaptured,
    recentActivity,
  };
};

module.exports = {
  getPerformanceSummaryService,
};