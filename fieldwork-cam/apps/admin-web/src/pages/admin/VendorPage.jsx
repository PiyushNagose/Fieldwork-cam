import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  InputAdornment,
  OutlinedInput,
  Stack,
  Typography,
} from "@mui/material";
import {
  AddOutlined,
  ApartmentOutlined,
  ArrowOutwardOutlined,
  AssignmentTurnedInOutlined,
  BarChartOutlined,
  CalendarMonthOutlined,
  CheckCircleOutlineOutlined,
  LocationOnOutlined,
  SearchOutlined,
  StarOutlined,
  VisibilityOutlined,
  WorkOutlineOutlined,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { getVendorsApi } from "../../api/vendor.api";
import { getProjectsApi } from "../../api/project.api";
import AssignVendorProjectDialog from "./AssignVendorProjectDialog";

const STATUS_FILTERS = ["ALL", "ACTIVE", "SUSPENDED"];
const COMPLETED_STATUSES = ["Approved", "Completed"];
const ACTIVE_STATUSES = ["New", "In Progress", "Submitted", "Retake Requested"];
const REVIEWABLE_STATUSES = ["Submitted", "Approved", "Completed", "Rejected"];

export default function VendorsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [vendors, setVendors] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [assigningVendor, setAssigningVendor] = useState(null);

  const successState = location.state?.vendorCreated || null;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (statusFilter !== "ALL") {
        params.status = statusFilter;
      }

      const [vendorsRes, projectsRes] = await Promise.all([
        getVendorsApi(params),
        getProjectsApi(),
      ]);

      const vendorData = vendorsRes?.data || vendorsRes || [];
      const projectData = projectsRes?.data || projectsRes || [];

      setVendors(Array.isArray(vendorData) ? vendorData : []);
      setProjects(Array.isArray(projectData) ? projectData : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load vendors",
      );
      setVendors([]);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const vendorsWithMetrics = useMemo(() => {
    return vendors.map((vendor) => {
      const vendorProjects = projects.filter(
        (project) => project.assignedVendorAuthUserId === vendor.authUserId,
      );

      const completedProjects = vendorProjects.filter((project) =>
        COMPLETED_STATUSES.includes(project.status),
      ).length;
      const activeProjects = vendorProjects.filter((project) =>
        ACTIVE_STATUSES.includes(project.status),
      ).length;
      const reviewableCount = vendorProjects.filter((project) =>
        REVIEWABLE_STATUSES.includes(project.status),
      ).length;
      const approvalCount = vendorProjects.filter((project) =>
        COMPLETED_STATUSES.includes(project.status),
      ).length;

      const approvalRate = reviewableCount
        ? Math.round((approvalCount / reviewableCount) * 100)
        : 0;

      const currentMonthCount = vendorProjects.filter(
        (project) => monthKey(project.createdAt) === monthKey(new Date()),
      ).length;
      const previousMonthCount = vendorProjects.filter(
        (project) =>
          monthKey(project.createdAt) === previousMonthKey(monthKey(new Date())),
      ).length;

      const monthlyGrowth =
        previousMonthCount === 0
          ? currentMonthCount > 0
            ? 100
            : 0
          : Math.round(
              ((currentMonthCount - previousMonthCount) / previousMonthCount) * 100,
            );

      const averageProgress = vendorProjects.length
        ? Math.round(
            vendorProjects.reduce(
              (sum, project) => sum + Number(project.progress || 0),
              0,
            ) / vendorProjects.length,
          )
        : 0;

      return {
        ...vendor,
        completedProjects,
        activeProjects,
        totalProjects: vendorProjects.length,
        approvalRate,
        monthlyGrowth,
        rating:
          typeof vendor.rating === "number" && vendor.rating > 0
            ? vendor.rating
            : null,
        averageProgress,
      };
    });
  }, [vendors, projects]);

  const filteredVendors = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return vendorsWithMetrics;

    return vendorsWithMetrics.filter((item) =>
      [
        item.companyName,
        item.fullName,
        item.email,
        item.businessEmail,
        item.businessPhone,
        item.serviceArea,
        ...(item.serviceTypes || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [vendorsWithMetrics, search]);

  const stats = useMemo(() => {
    const totalVendors = vendorsWithMetrics.length;
    const activeVendors = vendorsWithMetrics.filter(
      (vendor) => vendor.status === "ACTIVE",
    ).length;
    const avgApprovalRate = vendorsWithMetrics.length
      ? Math.round(
          vendorsWithMetrics.reduce(
            (sum, vendor) => sum + Number(vendor.approvalRate || 0),
            0,
          ) / vendorsWithMetrics.length,
        )
      : 0;
    const totalCompleted = vendorsWithMetrics.reduce(
      (sum, vendor) => sum + Number(vendor.completedProjects || 0),
      0,
    );

    return { totalVendors, activeVendors, avgApprovalRate, totalCompleted };
  }, [vendorsWithMetrics]);

  return (
    <Box
      sx={{
        px: { xs: 1.5, md: 2 },
        py: { xs: 1.5, md: 2 },
        bgcolor: "#F8F5F2",
        minHeight: "100%",
      }}
    >
      <Typography
        sx={{
          fontSize: 28,
          fontWeight: 700,
          color: "#1F2937",
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
        }}
      >
        Vendors
      </Typography>

      <Typography
        sx={{
          mt: 0.5,
          color: "#9CA3AF",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        Manage vendor relationships and performance.
      </Typography>

      {successState ? (
        <Alert
          severity={successState.emailDelivery?.sent ? "success" : "warning"}
          sx={{ mt: 2, borderRadius: 1 }}
        >
          {successState.emailDelivery?.sent
            ? `Vendor created and invite email sent to ${successState.email}.`
            : `Vendor created. Invite email was not sent automatically${
                successState.emailDelivery?.reason
                  ? ` (${successState.emailDelivery.reason})`
                  : ""
              }.`}
        </Alert>
      ) : null}

      <Box
        sx={{
          mt: 2.2,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr 1fr",
            xl: "repeat(4, minmax(0, 1fr))",
          },
          gap: 1.5,
        }}
      >
        <StatCard
          icon={<ApartmentOutlined sx={{ fontSize: 18, color: "#7A7A7A" }} />}
          label="Total Vendors"
          value={stats.totalVendors}
        />
        <StatCard
          icon={<CheckCircleOutlineOutlined sx={{ fontSize: 18, color: "#22C55E" }} />}
          label="Active Vendors"
          value={stats.activeVendors}
        />
        <StatCard
          icon={<BarChartOutlined sx={{ fontSize: 18, color: "#D88B72" }} />}
          label="Avg. Approval Rate"
          value={`${stats.avgApprovalRate}%`}
        />
        <StatCard
          icon={
            <AssignmentTurnedInOutlined sx={{ fontSize: 18, color: "#5B8DEF" }} />
          }
          label="Total Completed"
          value={stats.totalCompleted}
        />
      </Box>

      <Stack
        direction={{ xs: "column", lg: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", lg: "center" }}
        spacing={1.5}
        sx={{ mt: 1.5 }}
      >
        <OutlinedInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search vendors..."
          startAdornment={
            <InputAdornment position="start">
              <SearchOutlined sx={{ fontSize: 17, color: "#B4ADA6" }} />
            </InputAdornment>
          }
          sx={{
            flex: 1,
            maxWidth: { xs: "100%", lg: 420 },
            height: 40,
            bgcolor: "#F5EFEB",
            borderRadius: 1,
            fontSize: 13,
            color: "#4B5563",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E8E0DA" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#DFD6CF" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#D7C9BD",
              borderWidth: "1px",
            },
          }}
        />

        <Stack direction="row" spacing={0.9} flexWrap="wrap" useFlexGap>
          {STATUS_FILTERS.map((item) => {
            const active = statusFilter === item;
            return (
              <Button
                key={item}
                onClick={() => setStatusFilter(item)}
                sx={{
                  px: 1.6,
                  minHeight: 28,
                  borderRadius: 1,
                  bgcolor: active ? "#F1DED4" : "#F7F3F0",
                  color: active ? "#4F433B" : "#8F8A84",
                  border: "1px solid #E9E2DC",
                  fontWeight: 600,
                  fontSize: 11,
                  textTransform: "none",
                  minWidth: "auto",
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: active ? "#EAD7CC" : "#F2EEEA",
                    borderColor: "#E1D8D1",
                    boxShadow: "none",
                  },
                }}
              >
                {item === "ALL"
                  ? "All"
                  : item.charAt(0) + item.slice(1).toLowerCase()}
              </Button>
            );
          })}

          <Button
            variant="contained"
            startIcon={<AddOutlined sx={{ fontSize: 16 }} />}
            onClick={() => navigate("/admin/vendors/new")}
            sx={{
              borderRadius: 1,
              bgcolor: "#8D7B72",
              textTransform: "none",
              fontSize: 11.5,
              fontWeight: 600,
              boxShadow: "none",
              "&:hover": { bgcolor: "#7D6B63", boxShadow: "none" },
            }}
          >
            Add Vendor
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{ minHeight: 320 }}
          spacing={2}
        >
          <CircularProgress />
          <Typography color="text.secondary">Loading vendors...</Typography>
        </Stack>
      ) : error ? (
        <Box sx={{ mt: 1.5 }}>
          <Alert severity="error">{error}</Alert>
          <Button sx={{ mt: 2 }} variant="contained" onClick={fetchData}>
            Retry
          </Button>
        </Box>
      ) : filteredVendors.length === 0 ? (
        <Box
          sx={{
            mt: 1.5,
            minHeight: 180,
            borderRadius: 1,
            border: "1px dashed #E5DED7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#B0B5BE",
            fontSize: 13,
            bgcolor: "#FCFAF8",
          }}
        >
          No vendors found
        </Box>
      ) : (
        <Box
          sx={{
            mt: 1.5,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", xl: "repeat(2, minmax(0, 1fr))" },
            gap: 1.5,
          }}
        >
          {filteredVendors.map((vendor, index) => (
            <Card
              key={vendor._id || vendor.id || index}
              sx={{
                p: 2,
                borderRadius: 1,
                border: "1px solid #E9E1DB",
                boxShadow: "none",
                bgcolor: "#FFFFFF",
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Avatar
                    sx={{
                      width: 38,
                      height: 38,
                      bgcolor: avatarColor(index),
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {initials(vendor.companyName || vendor.fullName || "Vendor")}
                  </Avatar>

                  <Box>
                    <Typography
                      sx={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#1F2937",
                        lineHeight: 1.2,
                      }}
                    >
                      {vendor.companyName || "Unnamed Vendor"}
                    </Typography>
                    <Typography
                      sx={{
                        mt: 0.3,
                        fontSize: 12.5,
                        color: "#9CA3AF",
                        fontWeight: 500,
                      }}
                    >
                      {vendor.fullName || vendor.contactName || "-"}
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={1.2}
                      alignItems="center"
                      flexWrap="wrap"
                      useFlexGap
                      sx={{ mt: 0.75 }}
                    >
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <LocationOnOutlined sx={{ fontSize: 13, color: "#B0B5BE" }} />
                        <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>
                          {vendor.serviceArea || vendor.address || "-"}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <CalendarMonthOutlined sx={{ fontSize: 13, color: "#B0B5BE" }} />
                        <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>
                          {vendor.joinedAt
                            ? `Joined ${new Date(vendor.joinedAt).toLocaleDateString()}`
                            : "-"}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                </Stack>

                {statusChip(vendor.status)}
              </Stack>

              <Box
                sx={{
                  mt: 1.5,
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 1,
                }}
              >
                <MiniMetric value={vendor.completedProjects} label="Completed" />
                <MiniMetric value={`${vendor.approvalRate}%`} label="Approval" />
                <MiniMetric value={vendor.activeProjects} label="Active" />
              </Box>

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mt: 1.5 }}
              >
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <StarOutlined sx={{ fontSize: 15, color: "#EAB308" }} />
                  <Typography
                    sx={{ fontSize: 13, fontWeight: 700, color: "#1F2937" }}
                  >
                    {vendor.rating ?? "-"}
                  </Typography>
                </Stack>

                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    color:
                      Number(vendor.monthlyGrowth) >= 0 ? "#22C55E" : "#EF4444",
                  }}
                >
                  {Number(vendor.monthlyGrowth) >= 0 ? "+" : ""}
                  {vendor.monthlyGrowth}% this month
                </Typography>
              </Stack>

              <Stack
                direction="row"
                spacing={0.8}
                flexWrap="wrap"
                useFlexGap
                sx={{ mt: 1.25, minHeight: 24 }}
              >
                {(vendor.serviceTypes || []).map((item, idx) => (
                  <Chip
                    key={`${item}-${idx}`}
                    label={item}
                    size="small"
                    sx={{
                      borderRadius: 1,
                      bgcolor: "#F8F5F1",
                      color: "#6B7280",
                      height: 22,
                      fontSize: 11,
                    }}
                  />
                ))}
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<VisibilityOutlined sx={{ fontSize: 15 }} />}
                  onClick={() =>
                    navigate(`/admin/vendors/${vendor._id || vendor.id || vendor.authUserId}`)
                  }
                  sx={{
                    borderRadius: 1,
                    borderColor: "#E9E1DB",
                    color: "#6B7280",
                    bgcolor: "#FFFFFF",
                    textTransform: "none",
                    fontSize: 12,
                    fontWeight: 600,
                    boxShadow: "none",
                    "&:hover": {
                      borderColor: "#DED3CB",
                      bgcolor: "#FCFAF8",
                      boxShadow: "none",
                    },
                  }}
                >
                  View Profile
                </Button>

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<WorkOutlineOutlined sx={{ fontSize: 15 }} />}
                  onClick={() => setAssigningVendor(vendor)}
                  sx={{
                    borderRadius: 1,
                    bgcolor: "#8D7B72",
                    textTransform: "none",
                    fontSize: 12,
                    fontWeight: 600,
                    boxShadow: "none",
                    "&:hover": { bgcolor: "#7D6B63", boxShadow: "none" },
                  }}
                >
                  Assign Project
                </Button>

                <Button
                  sx={{
                    minWidth: 36,
                    width: 36,
                    borderRadius: 1,
                    p: 0,
                    color: "#A4ABB5",
                    border: "1px solid #E9E1DB",
                  }}
                >
                  <ArrowOutwardOutlined sx={{ fontSize: 17 }} />
                </Button>
              </Stack>
            </Card>
          ))}
        </Box>
      )}

      <AssignVendorProjectDialog
        open={Boolean(assigningVendor)}
        vendor={assigningVendor}
        onClose={() => setAssigningVendor(null)}
        onAssigned={fetchData}
      />
    </Box>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <Card
      sx={{
        p: 2,
        borderRadius: 1,
        border: "1px solid #E9E1DB",
        boxShadow: "none",
        bgcolor: "#FFFFFF",
      }}
    >
      <Stack direction="row" spacing={1.2} alignItems="center">
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            bgcolor: "rgba(0,0,0,0.04)",
            display: "grid",
            placeItems: "center",
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>
            {label}
          </Typography>
          <Typography
            sx={{
              mt: 0.6,
              fontSize: 22,
              fontWeight: 700,
              color: "#1F2937",
              lineHeight: 1.1,
            }}
          >
            {value}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}

function MiniMetric({ value, label }) {
  return (
    <Box
      sx={{
        p: 1.2,
        borderRadius: 1,
        bgcolor: "#F8F5F2",
        textAlign: "center",
      }}
    >
      <Typography
        sx={{ fontSize: 16, fontWeight: 700, color: "#1F2937", lineHeight: 1.1 }}
      >
        {value}
      </Typography>
      <Typography
        sx={{ mt: 0.3, fontSize: 10.5, color: "#9CA3AF", fontWeight: 500 }}
      >
        {label.toUpperCase()}
      </Typography>
    </Box>
  );
}

function statusChip(status = "") {
  const map = {
    ACTIVE: { bg: "#EAFBF1", color: "#22C55E", label: "Active" },
    SUSPENDED: { bg: "#FEE2E2", color: "#DC2626", label: "Suspended" },
    INACTIVE: { bg: "#F3F4F6", color: "#6B7280", label: "Inactive" },
  };
  const current = map[status] || {
    bg: "#F3F4F6",
    color: "#6B7280",
    label: status || "-",
  };
  return (
    <Chip
      label={current.label}
      size="small"
      sx={{
        bgcolor: current.bg,
        color: current.color,
        fontWeight: 700,
        borderRadius: 999,
        height: 24,
        fontSize: 11,
      }}
    />
  );
}

function initials(name = "") {
  const parts = name.trim().split(" ").filter(Boolean);
  if (!parts.length) return "V";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "V";
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function avatarColor(index) {
  const colors = [
    "#D88B72",
    "#5B8DEF",
    "#8B5CF6",
    "#EAB308",
    "#22C55E",
    "#9CA3AF",
    "#3B82F6",
    "#F87171",
  ];
  return colors[index % colors.length];
}

function monthKey(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function previousMonthKey(key) {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
