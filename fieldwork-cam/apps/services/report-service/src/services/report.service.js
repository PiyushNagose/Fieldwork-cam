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
  const [photosRes, projectRes] = await Promise.all([
    axios.get(`${env.MEDIA_SERVICE_URL}/media/project/${projectId}`, {
      headers: { authorization: authHeader },
    }),
    axios.get(`${env.PROJECT_SERVICE_URL}/projects/${projectId}`, {
      headers: { authorization: authHeader },
    }),
  ]);

  const photos = photosRes.data?.data || [];
  const project = projectRes.data?.data || projectRes.data || {};
  const categories = buildCategoryMap(photos);

  const avgAiScore = photos.length
    ? Math.round(
        photos.reduce((sum, item) => sum + (item.aiScore || 0), 0) /
          photos.length,
      )
    : 0;

  const timestamps = photos
    .map((item) => new Date(item.timestampCaptured || item.createdAt || 0).getTime())
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);
  const durationMinutes =
    timestamps.length >= 2 ? Math.max(1, Math.round((timestamps[timestamps.length - 1] - timestamps[0]) / 60000)) : 0;
  const timeOnSite = durationMinutes
    ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
    : "Not available";

  const normalizedStatus = ["Approved", "Completed"].includes(project.status)
    ? "Completed"
    : project.status === "Submitted"
      ? "In Review"
      : project.status === "Retake Requested"
        ? "Pending"
        : "Draft";

  const report = await upsertReportByProjectId(projectId, {
    projectId,
    workOrderNumber: project.workOrderNumber || photos[0]?.workOrderNumber || `WO-${projectId}`,
    title: project.serviceType ? `${project.serviceType} Report` : "Project Report",
    address: project.address || "",
    vendorAuthUserId,
    status: normalizedStatus,
    progress: Number(project.progress || (photos.length ? Math.min(100, categories.length * 12) : 0)),
    summary: {
      totalCategories: categories.length,
      aiQualityScore: avgAiScore,
      gpsStatus: photos.every((p) => p.gpsLatitude && p.gpsLongitude)
        ? "Confirmed"
        : "Partial",
      timeOnSite,
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
