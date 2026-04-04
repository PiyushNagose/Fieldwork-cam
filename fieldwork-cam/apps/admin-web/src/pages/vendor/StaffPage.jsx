import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Stack,
  Typography,
} from "@mui/material";
import {
  MoreVertOutlined,
  PersonAddOutlined,
  SearchOutlined,
} from "@mui/icons-material";
import AddStaffModal from "./AddStaffModal";
import AssignProjectModal from "./AssignProjectModal";
import {
  getStaffApi,
  getStaffStatsApi,
  updateStaffStatusApi,
} from "../../api/staff.api";

const FILTERS = ["All", "Active", "On Leave", "Inactive"];

export default function StaffPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [staff, setStaff] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [openAdd, setOpenAdd] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      setError("");
      const [teamRes, statsRes] = await Promise.all([
        getStaffApi(),
        getStaffStatsApi(),
      ]);
      setStaff(teamRes?.data || []);
      setStats(statsRes?.data || {});
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load staff members",
      );
      setStaff([]);
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();
    return staff.filter((member) => {
      const matchesSearch = query
        ? [
            member.fullName,
            member.email,
            member.location,
            member.authUserId,
            member.roleTitle,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query)
        : true;

      const matchesFilter =
        filter === "All" ? true : mapStatus(member.status).label === filter;

      return matchesSearch && matchesFilter;
    });
  }, [staff, search, filter]);

  const filterCounts = useMemo(
    () => ({
      All: staff.length,
      Active: staff.filter((item) => item.status === "ACTIVE").length,
      "On Leave": staff.filter((item) => item.status === "ON_LEAVE").length,
      Inactive: staff.filter((item) => item.status === "INACTIVE").length,
    }),
    [staff],
  );

  const handleStatusToggle = async (member) => {
    const nextStatus = member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await updateStaffStatusApi(member.authUserId, nextStatus);
    await fetchStaffData();
  };

  const handleStaffCreated = async (createdStaff) => {
    await fetchStaffData();

    const email = createdStaff?.email || "the staff member";
    if (createdStaff?.emailDelivery?.sent) {
      setSuccess(`Invite email sent to ${email}.`);
      return;
    }

    setSuccess(
      `Staff created for ${email}, but invite email was not sent automatically${
        createdStaff?.emailDelivery?.reason
          ? ` (${createdStaff.emailDelivery.reason})`
          : ""
      }.`,
    );
  };

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 320 }}>
        <CircularProgress />
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
        direction="row"
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1.5}
      >
        <Box>
          <Typography
            sx={{
              fontSize: 28,
              fontWeight: 700,
              color: "#1F2937",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            Staff Management
          </Typography>
          <Typography
            sx={{ mt: 0.5, color: "#9CA3AF", fontSize: 13, fontWeight: 500 }}
          >
            {stats.total || 0} team members
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<PersonAddOutlined />}
          onClick={() => setOpenAdd(true)}
          sx={{
            minHeight: 36,
            px: 1.5,
            borderRadius: 1,
            bgcolor: "#E9CFC2",
            color: "#5F4A40",
            boxShadow: "none",
            fontSize: 12.5,
            fontWeight: 600,
            "&:hover": {
              bgcolor: "#DFC1B3",
              boxShadow: "none",
            },
          }}
        >
          Add Staff
        </Button>
      </Stack>

      <Box
        sx={{
          mt: 1.5,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            xl: "repeat(4, 1fr)",
          },
          gap: 1.5,
        }}
      >
        <MetricCard label="Total Staff" value={stats.total || 0} accent="#6366F1" />
        <MetricCard label="Active Now" value={stats.active || 0} accent="#10B981" />
        <MetricCard
          label="Active Projects"
          value={stats.activeProjects || 0}
          accent="#F59E0B"
        />
        <MetricCard
          label="Avg Rating"
          value={formatRating(stats.avgRating)}
          accent="#38BDF8"
        />
      </Box>

      <Card
        sx={{
          mt: 1.5,
          p: 2,
          borderRadius: 1,
          border: "1px solid #E9E1DB",
          boxShadow: "none",
        }}
      >
        <OutlinedInput
          fullWidth
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, role, location, or ID..."
          startAdornment={
            <InputAdornment position="start">
              <SearchOutlined sx={{ color: "#B3ACA5", fontSize: 18 }} />
            </InputAdornment>
          }
          sx={{
            height: 40,
            bgcolor: "#FFFFFF",
            borderRadius: 1,
            fontSize: 13,
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E9E1DB" },
          }}
        />

        <Stack
          direction="row"
          spacing={0.75}
          sx={{ mt: 1.5, overflowX: "auto", pb: 0.25 }}
        >
          {FILTERS.map((item) => (
            <Button
              key={item}
              onClick={() => setFilter(item)}
              sx={{
                minWidth: "fit-content",
                px: 1.15,
                minHeight: 28,
                borderRadius: 999,
                border: "1px solid #E9E1DB",
                bgcolor: filter === item ? "#D9C2B7" : "#FFFFFF",
                color: filter === item ? "#FFFFFF" : "#7C7F86",
                fontSize: 11.5,
                fontWeight: 600,
                textTransform: "none",
                "&:hover": {
                  bgcolor: filter === item ? "#D1B7AB" : "#F8F3EF",
                },
              }}
            >
              {item} {filterCounts[item]}
            </Button>
          ))}
        </Stack>
      </Card>

      {error ? (
        <Alert severity="error" sx={{ mt: 1.5, borderRadius: 1 }}>
          {error}
        </Alert>
      ) : null}

      {success ? (
        <Alert
          severity={success.includes("not sent") ? "warning" : "success"}
          onClose={() => setSuccess("")}
          sx={{ mt: 1.5, borderRadius: 1 }}
        >
          {success}
        </Alert>
      ) : null}

      <Box
        sx={{
          mt: 1.5,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" },
          gap: 1.5,
        }}
      >
        {filteredStaff.length ? (
          filteredStaff.map((member) => (
            <StaffCard
              key={member.authUserId}
              member={member}
              onAssign={() => {
                setSelectedStaff(member);
                setAssignOpen(true);
              }}
              onToggleStatus={() => handleStatusToggle(member)}
            />
          ))
        ) : (
          <Box
            sx={{
              minHeight: 180,
              border: "1px dashed #E5DED7",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "#FCFAF8",
              color: "#B0B5BE",
              fontSize: 13,
            }}
          >
            No staff members found
          </Box>
        )}
      </Box>

      <AddStaffModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSuccess={handleStaffCreated}
      />
      <AssignProjectModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        staff={selectedStaff}
        onSuccess={async (message) => {
          await fetchStaffData();
          setSuccess(message || "Projects assigned successfully.");
        }}
      />
    </Box>
  );
}

function MetricCard({ label, value, accent }) {
  return (
    <Card
      sx={{
        p: 1.75,
        borderRadius: 1,
        border: "1px solid #E9E1DB",
        boxShadow: "none",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            border: `2px solid ${accent}`,
          }}
        />
        <Typography sx={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>
          {label}
        </Typography>
      </Stack>
      <Typography
        sx={{
          mt: 0.65,
          fontSize: 22,
          fontWeight: 700,
          color: "#1F2937",
          lineHeight: 1.1,
        }}
      >
        {value}
      </Typography>
    </Card>
  );
}

function StaffCard({ member, onAssign, onToggleStatus }) {
  const status = mapStatus(member.status);

  return (
    <Card
      sx={{
        p: 1.5,
        borderRadius: 1,
        border: "1px solid #E9E1DB",
        boxShadow: "none",
        position: "relative",
        overflow: "hidden",
        "&::before":
          member.status === "ON_LEAVE"
            ? {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                bgcolor: "#F59E0B",
              }
            : undefined,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Stack direction="row" spacing={1.2}>
          <Avatar
            src={member.profilePhotoUrl || ""}
            sx={{
              width: 38,
              height: 38,
              borderRadius: 1,
              bgcolor: "#CBB8AD",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {member.fullName?.charAt(0) || "S"}
          </Avatar>

          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1F2937" }}>
              {member.fullName || "Unnamed Staff"}
            </Typography>
            <Typography
              sx={{ mt: 0.2, fontSize: 11.5, color: "#9CA3AF", fontWeight: 500 }}
            >
              {member.roleTitle || "Field Photographer"}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.6} alignItems="center">
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              bgcolor: status.color,
            }}
          />
          <Typography sx={{ fontSize: 11.5, color: status.color, fontWeight: 600 }}>
            {status.label}
          </Typography>
          <IconButton size="small" sx={{ color: "#B0B5BE" }}>
            <MoreVertOutlined sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>
      </Stack>

      <Box
        sx={{
          mt: 1.35,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 0.8,
        }}
      >
        <MiniMetricCard
          label="Active"
          value={Number(member.activeAssignments || 0)}
          bg="#EEF2FF"
          color="#6366F1"
        />
        <MiniMetricCard
          label="Done"
          value={Number(member.completedJobs || 0)}
          bg="#ECFDF5"
          color="#10B981"
        />
        <MiniMetricCard
          label="Rating"
          value={formatRating(member.rating)}
          bg="#FFF7ED"
          color="#F59E0B"
        />
      </Box>

      <Stack spacing={0.5} sx={{ mt: 1.2 }}>
        <Typography sx={{ fontSize: 11.5, color: "#6B7280", fontWeight: 500 }}>
          {member.email || "No email added"}
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: "#9CA3AF", fontWeight: 500 }}>
          {member.phone || "No phone"} {member.location ? `• ${member.location}` : ""}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={0.55} useFlexGap flexWrap="wrap" sx={{ mt: 1.1 }}>
        {(member.specialties || []).map((item) => (
          <Chip
            key={item}
            label={item}
            size="small"
            sx={{
              height: 22,
              borderRadius: 1,
              bgcolor: "#F5F7FA",
              color: "#7C7F86",
              fontSize: 10.5,
              fontWeight: 500,
            }}
          />
        ))}
      </Stack>

      <Typography sx={{ mt: 1.2, fontSize: 11, color: "#B0B5BE", fontWeight: 500 }}>
        {formatRelativeTime(member.lastActiveAt)}
      </Typography>

      <Stack direction="row" justifyContent="flex-end" spacing={0.8} sx={{ mt: 1.2 }}>
        <Button
          variant="contained"
          onClick={onAssign}
          sx={{
            minHeight: 26,
            px: 1,
            borderRadius: 1,
            bgcolor: "#E9CFC2",
            color: "#7C6258",
            boxShadow: "none",
            fontSize: 11,
            fontWeight: 600,
            textTransform: "none",
            "&:hover": {
              bgcolor: "#DFC1B3",
              boxShadow: "none",
            },
          }}
        >
          Re Assign
        </Button>
        <Button
          variant="text"
          onClick={onToggleStatus}
          sx={{
            minHeight: 26,
            px: 0.4,
            color: "#7C7F86",
            fontSize: 11,
            fontWeight: 600,
            textTransform: "none",
          }}
        >
          {member.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
        </Button>
      </Stack>
    </Card>
  );
}

function MiniMetricCard({ label, value, bg, color }) {
  return (
    <Box
      sx={{
        borderRadius: 1,
        bgcolor: bg,
        px: 1,
        py: 0.9,
      }}
    >
      <Typography sx={{ fontSize: 13, fontWeight: 700, color, textAlign: "center" }}>
        {value}
      </Typography>
      <Typography
        sx={{
          mt: 0.3,
          fontSize: 10,
          fontWeight: 600,
          color: "#B0B5BE",
          textAlign: "center",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function mapStatus(status = "") {
  if (status === "ACTIVE") return { label: "Active", color: "#10B981" };
  if (status === "ON_LEAVE") return { label: "On Leave", color: "#F59E0B" };
  return { label: "Inactive", color: "#9CA3AF" };
}

function formatRelativeTime(value) {
  if (!value) return "No recent activity";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No recent activity";
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "Online now";
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks} week${diffWeeks === 1 ? "" : "s"} ago`;
}

function formatRating(value) {
  const amount = Number(value || 0);
  return amount > 0 ? amount.toFixed(1) : "0.0";
}
