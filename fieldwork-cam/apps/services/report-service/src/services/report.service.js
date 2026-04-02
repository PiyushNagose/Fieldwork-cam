const axios = require("axios");
const env = require("../config/env");
const {
  findReportsByVendor,
  findReportByProjectId,
  upsertReportByProjectId,
} = require("../repositories/report.repository");

const buildCategoryMap = (photos) => {
  const map = new Map();

  for (const photo of photos) {
    if (!map.has(photo.category)) {
      map.set(photo.category, []);
    }

    map.get(photo.category).push({
      photoId: String(photo._id),
      fileUrl: photo.fileUrl,
      capturedAt: photo.timestampCaptured || photo.createdAt,
    });
  }

  return Array.from(map.entries()).map(([category, photos]) => ({
    category,
    photos,
  }));
};

const generateReportForProject = async (
  projectId,
  authHeader,
  vendorAuthUserId,
) => {
  const photosRes = await axios.get(
    `${env.MEDIA_SERVICE_URL}/media/project/${projectId}`,
    {
      headers: { authorization: authHeader },
    },
  );

  const photos = photosRes.data?.data || [];
  const categories = buildCategoryMap(photos);

  const avgAiScore = photos.length
    ? Math.round(
        photos.reduce((sum, item) => sum + (item.aiScore || 0), 0) /
          photos.length,
      )
    : 0;

  const report = await upsertReportByProjectId(projectId, {
    projectId,
    workOrderNumber: photos[0]?.workOrderNumber || `WO-${projectId}`,
    title: "Project Report",
    address: "Project Address",
    vendorAuthUserId,
    status: "Completed",
    progress: 100,
    summary: {
      totalCategories: categories.length,
      aiQualityScore: avgAiScore,
      gpsStatus: photos.every((p) => p.gpsLatitude && p.gpsLongitude)
        ? "Confirmed"
        : "Partial",
      timeOnSite: "1h 32m",
    },
    categories,
  });

  return report;
};

const getReportsService = async (vendorAuthUserId) => {
  return findReportsByVendor(vendorAuthUserId);
};

const getReportByProjectService = async (
  projectId,
  authHeader,
  vendorAuthUserId,
) => {
  let report = await findReportByProjectId(projectId);

  if (!report) {
    report = await generateReportForProject(
      projectId,
      authHeader,
      vendorAuthUserId,
    );
  }

  return report;
};

module.exports = {
  getReportsService,
  getReportByProjectService,
};
