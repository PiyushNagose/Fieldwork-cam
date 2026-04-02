import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowBackOutlined,
  EmailOutlined,
  PhoneOutlined,
  LocationOnOutlined,
  BusinessOutlined,
  CalendarMonthOutlined,
  LanguageOutlined,
  GroupsOutlined,
  StarOutlined,
  EditOutlined,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { getVendorByIdApi } from "../../api/vendor.api";
import { getProjectsApi } from "../../api/project.api";

// --- Global Styles ---
const cardBaseSx = {
  borderRadius: 2,
  border: "1px solid #E9E1DB",
  boxShadow: "none",
  overflow: "hidden",
  bgcolor: "#FFFFFF",
};

export default function VendorDetailsPage() {
  const navigate = useNavigate();
  const { vendorId } = useParams();

  const [vendor, setVendor] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchVendor = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [vendorRes, projectsRes] = await Promise.all([
        getVendorByIdApi(vendorId),
        getProjectsApi(),
      ]);
      const vendorData = vendorRes?.data || vendorRes || null;
      const projectData = projectsRes?.data || projectsRes || [];
      setVendor(vendorData);
      setProjects(Array.isArray(projectData) ? projectData : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load vendor details",
      );
      setVendor(null);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    if (vendorId) fetchVendor();
  }, [vendorId, fetchVendor]);

  const stats = useMemo(
    () => {
      const vendorProjects = projects.filter(
        (project) => project.assignedVendorAuthUserId === vendor?.authUserId,
      );

      return {
        totalProjects: vendorProjects.length,
        completedProjects: vendorProjects.filter((project) =>
          ["Approved", "Completed"].includes(project.status),
        ).length,
        activeProjects: vendorProjects.filter((project) =>
          ["New", "In Progress", "Submitted", "Retake Requested"].includes(
            project.status,
          ),
        ).length,
        rating: typeof vendor?.rating === "number" && vendor.rating > 0 ? vendor.rating : "-",
      };
    },
    [projects, vendor],
  );

  const statusChip = (status = "") => {
    const map = {
      ACTIVE: { bg: "#ECFDF5", color: "#10B981", label: "Active" },
      SUSPENDED: { bg: "#FEF2F2", color: "#EF4444", label: "Suspended" },
      INACTIVE: { bg: "#F9FAFB", color: "#6B7280", label: "Inactive" },
    };
    const current = map[status] || {
      bg: "#F3F4F6",
      color: "#6B7280",
      label: status || "—",
    };
    return (
      <Chip
        label={current.label}
        size="small"
        sx={{
          bgcolor: current.bg,
          color: current.color,
          fontWeight: 700,
          borderRadius: 1,
          fontSize: 11,
          height: 24,
        }}
      />
    );
  };

  const initials = (value = "") => {
    const parts = value.trim().split(" ").filter(Boolean);
    if (!parts.length) return "V";
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "V";
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };

  if (loading)
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: 400 }}
        spacing={2}
      >
        <CircularProgress sx={{ color: "#8E8175" }} />
        <Typography color="text.secondary" variant="body2">
          Loading vendor profile...
        </Typography>
      </Stack>
    );

  if (error || !vendor)
    return (
      <Box sx={{ p: 4 }}>
        <Button
          startIcon={<ArrowBackOutlined />}
          onClick={() => navigate("/admin/vendors")}
          sx={{ mb: 2, color: "#6B7280" }}
        >
          Back
        </Button>
        {error ? (
          <Alert severity="error">
            {error}{" "}
            <Button size="small" onClick={fetchVendor}>
              Retry
            </Button>
          </Alert>
        ) : (
          <Card sx={{ ...cardBaseSx, p: 4, textAlign: "center" }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Vendor not found
            </Typography>
          </Card>
        )}
      </Box>
    );

  return (
    <Box
      sx={{
        px: { xs: 2, md: 4 },
        py: 3,
        bgcolor: "#F8F5F2",
        minHeight: "100vh",
      }}
    >
      {/* Top Navigation */}
      <Button
        startIcon={<ArrowBackOutlined sx={{ fontSize: 18 }} />}
        onClick={() => navigate("/admin/vendors")}
        sx={{
          mb: 3,
          textTransform: "none",
          color: "#6B7280",
          fontWeight: 600,
          "&:hover": { bgcolor: "transparent", color: "#111827" },
        }}
      >
        Back to Vendor Directory
      </Button>

      {/* Hero Profile Card */}
      <Card sx={{ ...cardBaseSx, mb: 3 }}>
        <Box
          sx={{
            height: 140,
            bgcolor: "#E7E0D9",
            backgroundImage:
              "linear-gradient(135deg, #E7E0D9 0%, #D8CEC4 100%)",
          }}
        />
        <Box sx={{ px: 4, pb: 4 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems="flex-end"
            sx={{ mt: -5 }}
          >
            <Stack direction="row" spacing={3} alignItems="flex-end">
              <Avatar
                sx={{
                  width: 110,
                  height: 110,
                  bgcolor: "#8E8175",
                  fontSize: 36,
                  fontWeight: 800,
                  border: "5px solid #FFFFFF",
                  boxShadow: "0px 4px 20px rgba(0,0,0,0.08)",
                }}
              >
                {initials(vendor.companyName || vendor.fullName || "Vendor")}
              </Avatar>
              <Box sx={{ pb: 1 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography
                    sx={{
                      fontSize: 32,
                      fontWeight: 800,
                      color: "#1F2937",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {vendor.companyName || "Unnamed Vendor"}
                  </Typography>
                  {statusChip(vendor.status)}
                </Stack>
                <Typography
                  sx={{ fontSize: 16, color: "#6B7280", fontWeight: 500 }}
                >
                  {vendor.roleTitle || vendor.fullName || "Vendor Partner"}
                </Typography>
              </Box>
            </Stack>
            <Button
              variant="contained"
              startIcon={<EditOutlined />}
              sx={{
                height: 40,
                px: 3,
                borderRadius: 1.5,
                textTransform: "none",
                fontWeight: 700,
                bgcolor: "#FFFFFF",
                color: "#374151",
                border: "1px solid #E5E7EB",
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "#F9FAFB",
                  boxShadow: "none",
                  borderColor: "#D1D5DB",
                },
              }}
            >
              Edit Profile
            </Button>
          </Stack>

          <Divider sx={{ my: 3, borderColor: "#F3F4F6" }} />

          <Stack
            direction="row"
            spacing={4}
            flexWrap="wrap"
            useFlexGap
            sx={{ color: "#6B7280" }}
          >
            <InlineInfo
              icon={<EmailOutlined />}
              value={vendor.email || vendor.businessEmail}
            />
            <InlineInfo
              icon={<PhoneOutlined />}
              value={vendor.phone || vendor.businessPhone}
            />
            <InlineInfo
              icon={<LocationOnOutlined />}
              value={vendor.serviceArea || vendor.address}
            />
            <InlineInfo
              icon={<CalendarMonthOutlined />}
              value={
                vendor.joinedAt
                  ? `Joined ${new Date(vendor.joinedAt).toLocaleDateString()}`
                  : null
              }
            />
          </Stack>
        </Box>
      </Card>

      {/* Metrics Row */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          gap: 2.5,
          mb: 3,
        }}
      >
        <MetricCard label="Total Projects" value={stats.totalProjects} />
        <MetricCard label="Completed" value={stats.completedProjects} />
        <MetricCard label="Active Now" value={stats.activeProjects} />
        <MetricCard label="Avg Rating" value={stats.rating} isRating />
      </Box>

      {/* Content Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.2fr 0.8fr" },
          gap: 3,
        }}
      >
        {/* Left Column: About & Projects */}
        <Stack spacing={3}>
          <Card sx={{ ...cardBaseSx, p: 4 }}>
            <Typography
              sx={{ fontSize: 18, fontWeight: 800, color: "#1F2937", mb: 2 }}
            >
              Professional Bio
            </Typography>
            <Typography
              sx={{ fontSize: 15, color: "#4B5563", lineHeight: 1.7 }}
            >
              {vendor.bio ||
                vendor.description ||
                "No vendor description available."}
            </Typography>

            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 800,
                color: "#1F2937",
                mt: 4,
                mb: 2,
              }}
            >
              Specialties
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {(vendor.serviceTypes || []).length ? (
                vendor.serviceTypes.map((item, idx) => (
                  <Chip
                    key={idx}
                    label={item}
                    sx={{
                      bgcolor: "#F3F4F6",
                      color: "#374151",
                      fontWeight: 600,
                      borderRadius: 1.5,
                      fontSize: 12,
                    }}
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.disabled">
                  No specialties listed
                </Typography>
              )}
            </Stack>
          </Card>

          <Card sx={{ ...cardBaseSx, p: 4 }}>
            <Typography
              sx={{ fontSize: 18, fontWeight: 800, color: "#1F2937", mb: 3 }}
            >
              Recent Projects
            </Typography>
            <Stack spacing={2}>
              {(vendor.recentProjects || []).length ? (
                vendor.recentProjects.map((item, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: "1px solid #F3F4F6",
                      "&:hover": { bgcolor: "#F9FAFB" },
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box>
                        <Typography
                          sx={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#111827",
                          }}
                        >
                          {item.title || item.projectName}
                        </Typography>
                        <Typography
                          sx={{ fontSize: 12, color: "#9CA3AF", mt: 0.5 }}
                        >
                          {item.projectCode ||
                            item.workOrderNumber ||
                            "No Project ID"}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{ fontSize: 15, fontWeight: 800, color: "#111827" }}
                      >
                        {item.amount ? `$${item.amount}` : "—"}
                      </Typography>
                    </Stack>
                  </Box>
                ))
              ) : (
                <EmptyStateBox label="No projects recorded yet" />
              )}
            </Stack>
          </Card>
        </Stack>

        {/* Right Column: Quick Info & Activity */}
        <Stack spacing={3}>
          <Card sx={{ ...cardBaseSx, p: 4 }}>
            <Typography
              sx={{ fontSize: 18, fontWeight: 800, color: "#1F2937", mb: 3 }}
            >
              Organization Info
            </Typography>
            <Stack spacing={3}>
              <InfoRow
                icon={<BusinessOutlined />}
                label="Company"
                value={vendor.companyName}
              />
              <InfoRow
                icon={<LanguageOutlined />}
                label="Website"
                value={vendor.website}
              />
              <InfoRow
                icon={<LocationOnOutlined />}
                label="Primary Location"
                value={vendor.serviceArea || vendor.address}
              />
              <InfoRow
                icon={<GroupsOutlined />}
                label="Team Composition"
                value={
                  vendor.teamSize ? `${vendor.teamSize} photographers` : null
                }
              />
            </Stack>
          </Card>

          <Card sx={{ ...cardBaseSx, p: 4 }}>
            <Typography
              sx={{ fontSize: 18, fontWeight: 800, color: "#1F2937", mb: 3 }}
            >
              System Activity
            </Typography>
            <Stack spacing={3} sx={{ position: "relative" }}>
              {(vendor.recentActivity || []).length ? (
                vendor.recentActivity.map((item, idx) => (
                  <Stack
                    key={idx}
                    direction="row"
                    spacing={2}
                    alignItems="flex-start"
                  >
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: item.color || "#8E8175",
                        mt: 0.7,
                        flexShrink: 0,
                      }}
                    />
                    <Box>
                      <Typography
                        sx={{ fontSize: 14, fontWeight: 700, color: "#111827" }}
                      >
                        {item.title || "Activity Update"}
                      </Typography>
                      <Typography
                        sx={{ fontSize: 12, color: "#9CA3AF", mt: 0.4 }}
                      >
                        {item.timeAgo || item.date}
                      </Typography>
                    </Box>
                  </Stack>
                ))
              ) : (
                <EmptyStateBox label="No recent activity" />
              )}
            </Stack>
          </Card>
        </Stack>
      </Box>
    </Box>
  );
}

// --- Internal Helper Components ---

function InlineInfo({ icon, value }) {
  if (!value) return null;
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box
        sx={{ color: "#9CA3AF", display: "flex", "& svg": { fontSize: 18 } }}
      >
        {icon}
      </Box>
      <Typography sx={{ fontSize: 14, color: "#4B5563", fontWeight: 500 }}>
        {value}
      </Typography>
    </Stack>
  );
}

function MetricCard({ label, value, isRating }) {
  return (
    <Card sx={{ ...cardBaseSx, p: 3, bgcolor: "#FFFFFF" }}>
      <Typography
        sx={{
          fontSize: 12,
          color: "#9CA3AF",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </Typography>
      <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mt: 1.5 }}>
        <Typography sx={{ fontSize: 32, fontWeight: 900, color: "#1F2937" }}>
          {value}
        </Typography>
        {isRating && <StarOutlined sx={{ color: "#F59E0B", fontSize: 20 }} />}
      </Stack>
    </Card>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <Stack direction="row" spacing={2} alignItems="flex-start">
      <Box
        sx={{
          color: "#8E8175",
          bgcolor: "#F8F5F2",
          p: 1,
          borderRadius: 1.5,
          display: "flex",
          "& svg": { fontSize: 20 },
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography
          sx={{
            fontSize: 11,
            color: "#9CA3AF",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{ mt: 0.3, fontSize: 15, color: "#1F2937", fontWeight: 600 }}
        >
          {value || "—"}
        </Typography>
      </Box>
    </Stack>
  );
}

function EmptyStateBox({ label }) {
  return (
    <Box
      sx={{
        py: 4,
        textAlign: "center",
        border: "1px dashed #E5DED7",
        borderRadius: 2,
        bgcolor: "#FCFAF8",
      }}
    >
      <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>{label}</Typography>
    </Box>
  );
}
