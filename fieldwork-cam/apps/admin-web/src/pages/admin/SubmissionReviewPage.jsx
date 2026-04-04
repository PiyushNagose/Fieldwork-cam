import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AccessTimeOutlined,
  CheckCircleOutlineOutlined,
  ContentCopyOutlined,
  HistoryOutlined,
  ImageOutlined,
  LocationOnOutlined,
} from "@mui/icons-material";
import { useParams } from "react-router-dom";
import { getProjectByIdApi } from "../../api/project.api";
import { getProjectMediaApi } from "../../api/media.api";
import {
  getSubmissionByIdApi,
  requestRetakeSubmissionApi,
  reviewSubmissionApi,
} from "../../api/submission.api";
import { resolveMediaUrl } from "../../utils/mediaUrl";

const formatDateTime = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatDateOnly = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatLabel = (value = "") =>
  String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export default function SubmissionReviewPage() {
  const { submissionId } = useParams();
  const timelineRef = useRef(null);
  const [submission, setSubmission] = useState(null);
  const [project, setProject] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [comment, setComment] = useState("");

  const fetchSubmissionBundle = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const submissionResponse = await getSubmissionByIdApi(submissionId);
      const submissionData = submissionResponse?.data || submissionResponse;
      const projectId = submissionData?.projectId;

      setSubmission(submissionData);
      setComment(submissionData?.adminComments || "");

      if (!projectId) {
        setProject(null);
        setPhotos([]);
        return;
      }

      const [projectResponse, mediaResponse] = await Promise.allSettled([
        getProjectByIdApi(projectId),
        getProjectMediaApi(projectId),
      ]);

      if (projectResponse.status === "fulfilled") {
        setProject(projectResponse.value?.data || projectResponse.value || null);
      } else {
        setProject(null);
      }

      if (mediaResponse.status === "fulfilled") {
        const mediaData = mediaResponse.value?.data || mediaResponse.value || [];
        setPhotos(Array.isArray(mediaData) ? mediaData : []);
      } else {
        setPhotos([]);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load submission",
      );
      setSubmission(null);
      setProject(null);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    fetchSubmissionBundle();
  }, [fetchSubmissionBundle]);

  const selectedPhotos = useMemo(() => {
    const selectedIds = new Set((submission?.photoIds || []).map(String));
    const availablePhotos = Array.isArray(photos) ? photos : [];

    const normalizedPhotos = availablePhotos.map((photo) => ({
      ...photo,
      fileUrl: resolveMediaUrl(photo?.fileUrl || ""),
    }));

    if (!selectedIds.size) return normalizedPhotos;

    return normalizedPhotos.filter((photo) => selectedIds.has(String(photo._id)));
  }, [photos, submission]);

  const evidenceTiles = useMemo(() => {
    const items = selectedPhotos.slice(0, 4);

    while (items.length < 4) {
      items.push(null);
    }

    return items;
  }, [selectedPhotos]);

  const confidenceScore = useMemo(() => {
    if (submission?.aiAverageScore) return Math.round(submission.aiAverageScore);

    if (!selectedPhotos.length) return 0;

    return Math.round(
      selectedPhotos.reduce((sum, photo) => sum + (photo.aiScore || 0), 0) /
        selectedPhotos.length,
    );
  }, [selectedPhotos, submission]);

  const metadataSummary = useMemo(
    () => ({
      batchNumber: project?.workOrderNumber || "-",
      location: project?.address || "-",
      priority: project?.priority || "-",
    }),
    [project],
  );

  const qualityChecks = useMemo(() => {
    const gpsCount = selectedPhotos.filter(
      (photo) => photo.gpsLatitude != null && photo.gpsLongitude != null,
    ).length;
    const clarityCount = selectedPhotos.filter(
      (photo) => photo.aiChecks?.clarity || photo.aiStatus === "Passed",
    ).length;
    const timestampCount = selectedPhotos.filter(
      (photo) => photo.timestampCaptured,
    ).length;

    return [
      {
        label: "Metadata includes GPS location",
        value: `${gpsCount}/${selectedPhotos.length || 0}`,
        passed: gpsCount > 0,
      },
      {
        label: "AI clarity checks passed",
        value: `${clarityCount}/${selectedPhotos.length || 0}`,
        passed: clarityCount > 0,
      },
      {
        label: "Capture timestamps available",
        value: `${timestampCount}/${selectedPhotos.length || 0}`,
        passed: timestampCount > 0,
      },
    ];
  }, [selectedPhotos]);

  const reviewAction = async (type) => {
    try {
      setActing(true);
      setError("");
      setSuccessMessage("");

      if (type === "approve") {
        await reviewSubmissionApi(submissionId, {
          decision: "Approved",
          adminComments: comment,
        });
        setSuccessMessage("Submission approved successfully.");
      }

      if (type === "reject") {
        await reviewSubmissionApi(submissionId, {
          decision: "Rejected",
          adminComments: comment,
        });
        setSuccessMessage("Submission rejected successfully.");
      }

      if (type === "retake") {
        await requestRetakeSubmissionApi(submissionId, {
          adminComments: comment,
        });
        setSuccessMessage("Retake requested successfully.");
      }

      await fetchSubmissionBundle();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update submission",
      );
    } finally {
      setActing(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setSuccessMessage("Submission link copied to clipboard.");
    } catch {
      setSuccessMessage("Unable to copy link from this browser session.");
    }
  };

  const handleOpenHistory = () => {
    timelineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 320 }} spacing={2}>
        <CircularProgress />
        <Typography sx={{ fontSize: 13, color: "#8E8882" }}>
          Loading submission review...
        </Typography>
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        px: { xs: 1.5, md: 2 },
        py: { xs: 1.5, md: 2 },
        bgcolor: "#F8F5F2",
        minHeight: "100%",
      }}
    >
      <Stack
        direction={{ xs: "column", lg: "row" }}
        justifyContent="space-between"
        spacing={1.5}
        alignItems={{ xs: "flex-start", lg: "center" }}
      >
        <Box>
          <Typography sx={{ fontSize: 12, color: "#9EA3AE", fontWeight: 500 }}>
            Submissions &gt; Review ID #{submission?._id?.slice(-6) || submissionId}
          </Typography>
          <Typography
            sx={{
              mt: 0.55,
              fontSize: 28,
              fontWeight: 700,
              color: "#1F2937",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            Review Submission #{submission?._id?.slice(-6) || submissionId}
          </Typography>
          <Typography sx={{ mt: 0.45, fontSize: 13, color: "#8E8882", fontWeight: 500 }}>
            Submitted {project?.clientName ? `for ${project.clientName}` : ""} on{" "}
            {formatDateOnly(submission?.createdAt)}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<HistoryOutlined sx={{ fontSize: 15 }} />}
            onClick={handleOpenHistory}
            sx={headerButtonSx}
          >
            History
          </Button>
          <Button
            variant="outlined"
            startIcon={<ContentCopyOutlined sx={{ fontSize: 15 }} />}
            onClick={handleShare}
            sx={headerButtonSx}
          >
            Share
          </Button>
        </Stack>
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mt: 1.5, borderRadius: 1 }}>
          {error}
        </Alert>
      ) : null}
      {successMessage ? (
        <Alert severity="success" sx={{ mt: 1.5, borderRadius: 1 }}>
          {successMessage}
        </Alert>
      ) : null}

      <Stack direction={{ xs: "column", xl: "row" }} spacing={2} sx={{ mt: 2 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card sx={sectionCardSx}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.6 }}>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#1F2937" }}>
                Photo Evidence
              </Typography>
              <Box sx={confidenceBadgeSx}>{confidenceScore}% confidence score</Box>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 1.4,
              }}
            >
              {evidenceTiles.map((photo, index) =>
                photo ? (
                  <Box
                    key={photo._id || `${photo.fileUrl}-${index}`}
                    sx={{
                      position: "relative",
                      overflow: "hidden",
                      borderRadius: 1,
                      border: "1px solid #EAE2DC",
                      bgcolor: "#FAF8F6",
                      aspectRatio: "1.18 / 0.9",
                    }}
                  >
                    <Box
                      component="img"
                      src={photo.fileUrl}
                      alt={photo.originalName || photo.category || "Submission evidence"}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    <Box sx={photoLabelSx}>{formatLabel(photo.category || "Photo")}</Box>
                  </Box>
                ) : (
                  <Box
                    key={`placeholder-${index}`}
                    sx={{
                      borderRadius: 1,
                      border: "1px dashed #E4DCD5",
                      bgcolor: "#FBFAF8",
                      minHeight: 214,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      color: "#B8B2AC",
                    }}
                  >
                    <ImageOutlined sx={{ fontSize: 28, color: "#C5BEB8" }} />
                    <Typography sx={{ mt: 0.8, fontSize: 12.5, fontWeight: 500 }}>
                      Add Image
                    </Typography>
                  </Box>
                ),
              )}
            </Box>
          </Card>

          <Card sx={{ ...sectionCardSx, mt: 2 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#1F2937", mb: 2 }}>
              Submission Metadata
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                gap: 1.5,
              }}
            >
              <MetadataBlock label="Batch Number" value={metadataSummary.batchNumber} />
              <MetadataBlock label="Location" value={metadataSummary.location} icon={<LocationOnOutlined sx={metaIconSx} />} />
              <MetadataBlock label="Priority" value={metadataSummary.priority} />
            </Box>
          </Card>

          <Card ref={timelineRef} sx={{ ...sectionCardSx, mt: 2 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#1F2937", mb: 1.8 }}>
              Review Timeline
            </Typography>

            <Stack spacing={1.6}>
              {(submission?.timeline || []).length ? (
                submission.timeline
                  .slice()
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((item, index) => (
                    <Stack key={`${item.type}-${index}`} direction="row" spacing={1.25}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          bgcolor: index === 0 ? "#8D7B72" : "#D5CCC6",
                          mt: 0.6,
                          flexShrink: 0,
                        }}
                      />
                      <Box>
                        <Typography sx={{ fontSize: 13, color: "#3E3A36", fontWeight: 600 }}>
                          {formatLabel(item.type)}
                        </Typography>
                        <Typography sx={{ mt: 0.25, fontSize: 12, color: "#7C7771" }}>
                          {item.message || "No comment provided"}
                        </Typography>
                        <Typography sx={{ mt: 0.35, fontSize: 11, color: "#AAA39C" }}>
                          {formatDateTime(item.createdAt)}
                        </Typography>
                      </Box>
                    </Stack>
                  ))
              ) : (
                <Typography sx={{ fontSize: 12.5, color: "#A39D96" }}>
                  No timeline events yet.
                </Typography>
              )}
            </Stack>
          </Card>
        </Box>

        <Box sx={{ width: { xs: "100%", xl: 320 }, flexShrink: 0 }}>
          <Card sx={sectionCardSx}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#1F2937" }}>
              Review Action
            </Typography>

            <Typography sx={{ mt: 2, fontSize: 12, fontWeight: 700, color: "#8E8882" }}>
              Admin Comments
            </Typography>

            <TextField
              fullWidth
              multiline
              minRows={5}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Provide feedback or reasons for this decision..."
              sx={{
                mt: 0.8,
                "& .MuiInputBase-root": {
                  borderRadius: 1,
                  bgcolor: "#FBF8F6",
                  fontSize: 12.5,
                },
              }}
            />

            <Stack spacing={1.1} sx={{ mt: 2 }}>
              <Button
                fullWidth
                variant="contained"
                disabled={acting}
                onClick={() => reviewAction("approve")}
                sx={approveButtonSx}
              >
                Approve Submission
              </Button>
              <Button
                fullWidth
                variant="outlined"
                disabled={acting}
                onClick={() => reviewAction("retake")}
                sx={secondaryActionButtonSx}
              >
                Request Retake
              </Button>
              <Button
                fullWidth
                variant="outlined"
                disabled={acting}
                onClick={() => reviewAction("reject")}
                sx={rejectButtonSx}
              >
                Reject Submission
              </Button>
            </Stack>

            <Divider sx={{ my: 2.25, borderColor: "#EFE8E3" }} />

            <Typography sx={{ fontSize: 11, color: "#A6A09A", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Quality Checks
            </Typography>

            <Stack spacing={1.15} sx={{ mt: 1.4 }}>
              {qualityChecks.map((check) => (
                <Stack key={check.label} direction="row" spacing={1} alignItems="flex-start">
                  <CheckCircleOutlineOutlined
                    sx={{
                      mt: 0.05,
                      fontSize: 16,
                      color: check.passed ? "#22C55E" : "#C6C0BA",
                    }}
                  />
                  <Box>
                    <Typography sx={{ fontSize: 12.5, color: "#4B5563", fontWeight: 500 }}>
                      {check.label}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: "#AAA39C" }}>
                      {check.value}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Card>

          <Card sx={{ ...sectionCardSx, mt: 2 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1F2937", mb: 1.4 }}>
              Submission Overview
            </Typography>

            <Stack spacing={1.4}>
              <OverviewRow
                label="Project"
                value={project?.title || project?.serviceType || "-"}
              />
              <OverviewRow label="Project ID" value={project?.workOrderNumber || submission?.projectId || "-"} />
              <OverviewRow label="Status" value={submission?.status || "-"} />
              <OverviewRow label="Photos" value={String(selectedPhotos.length)} />
              <OverviewRow
                label="Submitted"
                value={formatDateOnly(submission?.createdAt)}
                icon={<AccessTimeOutlined sx={metaIconSx} />}
              />
            </Stack>
          </Card>
        </Box>
      </Stack>
    </Box>
  );
}

function MetadataBlock({ label, value, icon }) {
  return (
    <Box
      sx={{
        minHeight: 86,
        borderRadius: 1,
        bgcolor: "#FBF8F6",
        border: "1px solid #EFE8E3",
        p: 1.5,
      }}
    >
      <Typography
        sx={{
          fontSize: 10.5,
          color: "#A6A09A",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>
      <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 1 }}>
        {icon}
        <Typography sx={{ fontSize: 14, color: "#1F2937", fontWeight: 700 }}>
          {value || "-"}
        </Typography>
      </Stack>
    </Box>
  );
}

function OverviewRow({ label, value, icon }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.25}>
      <Typography sx={{ fontSize: 12, color: "#8E8882", fontWeight: 600 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={0.6} alignItems="center">
        {icon}
        <Typography sx={{ fontSize: 12.5, color: "#3E3A36", fontWeight: 600, textAlign: "right" }}>
          {value || "-"}
        </Typography>
      </Stack>
    </Stack>
  );
}

const sectionCardSx = {
  p: 2,
  borderRadius: 1,
  border: "1px solid #E9E1DB",
  boxShadow: "none",
  bgcolor: "#FFFFFF",
};

const headerButtonSx = {
  minWidth: 94,
  height: 36,
  borderRadius: 1,
  borderColor: "#E8E0DA",
  color: "#6B7280",
  bgcolor: "#FFFFFF",
  textTransform: "none",
  fontSize: 11.5,
  fontWeight: 600,
  boxShadow: "none",
  "&:hover": {
    borderColor: "#DED3CB",
    bgcolor: "#FCFAF8",
    boxShadow: "none",
  },
};

const confidenceBadgeSx = {
  px: 1.2,
  py: 0.55,
  borderRadius: 999,
  bgcolor: "#E8FBF1",
  color: "#0F9F67",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
};

const photoLabelSx = {
  position: "absolute",
  top: 10,
  right: 10,
  px: 1,
  py: 0.35,
  borderRadius: 0.7,
  bgcolor: "rgba(255,255,255,0.92)",
  color: "#3F3A36",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
};

const metaIconSx = {
  fontSize: 16,
  color: "#AAA39C",
};

const approveButtonSx = {
  minHeight: 40,
  borderRadius: 1,
  bgcolor: "#8D7B72",
  textTransform: "none",
  fontSize: 12.5,
  fontWeight: 700,
  boxShadow: "none",
  "&:hover": { bgcolor: "#7D6B63", boxShadow: "none" },
  "&.Mui-disabled": { bgcolor: "#D7CDC6", color: "#8F8A84" },
};

const secondaryActionButtonSx = {
  minHeight: 40,
  borderRadius: 1,
  borderColor: "#E1D8D1",
  color: "#4B5563",
  bgcolor: "#FFFFFF",
  textTransform: "none",
  fontSize: 12.5,
  fontWeight: 700,
  boxShadow: "none",
  "&:hover": {
    borderColor: "#D6CCC4",
    bgcolor: "#FCFAF8",
    boxShadow: "none",
  },
};

const rejectButtonSx = {
  ...secondaryActionButtonSx,
  borderColor: "#F2D7D9",
  color: "#D34F5B",
  bgcolor: "#FFF8F8",
  "&:hover": {
    borderColor: "#ECC7CB",
    bgcolor: "#FFF3F4",
    boxShadow: "none",
  },
};
