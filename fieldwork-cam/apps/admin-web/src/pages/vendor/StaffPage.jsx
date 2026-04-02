import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  Typography,
  Stack,
  Button,
  Chip,
  Avatar,
  CircularProgress,
  OutlinedInput,
  InputAdornment,
} from "@mui/material";
import { SearchOutlined, PersonAddOutlined } from "@mui/icons-material";

import AddStaffModal from "./AddStaffModal";
import { useAuth } from "../../auth/AuthContext";

import { getStaffApi, getStaffStatsApi } from "../../api/staff.api";
import AssignProjectModal from "./AssignProjectModal";

export default function StaffPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [open, setOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const fetch = async () => {
    try {
      setLoading(true);

      const [teamRes, statsRes] = await Promise.all([
        getStaffApi(),
        getStaffStatsApi(),
      ]);

      setStaff(teamRes?.data || []);
      setStats(statsRes?.data || {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const filtered = useMemo(() => {
    return staff
      .filter((s) =>
        (s.fullName || "").toLowerCase().includes(search.toLowerCase()),
      )
      .filter((s) =>
        filter === "All" ? true : mapStatus(s.status) === filter,
      );
  }, [staff, search, filter]);

  if (loading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: 300 }}
      >
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Box>
      {/* HEADER */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography sx={{ fontSize: 28, fontWeight: 700 }}>
            Staff Management
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>
            Manage your field team and assignments
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<PersonAddOutlined />}
          onClick={() => setOpen(true)}
          sx={{
            height: 36,
            bgcolor: "#1F2937",
            fontSize: 12.5,
            textTransform: "none",
          }}
        >
          Add Staff
        </Button>
      </Stack>

      {/* STATS */}
      <Box
        sx={{
          mt: 2.25,
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 1.5,
        }}
      >
        <StatCard label="Total Staff" value={stats.total || 0} />
        <StatCard label="Active Now" value={stats.active || 0} />
        <StatCard label="On Leave" value={stats.onLeave || 0} />
        <StatCard label="Inactive" value={stats.inactive || 0} />
      </Box>

      {/* SEARCH + FILTER */}
      <Card sx={{ mt: 1.5, p: 2, border: "1px solid #E9E1DB" }}>
        <OutlinedInput
          fullWidth
          size="small"
          placeholder="Search by name, email, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startAdornment={
            <InputAdornment position="start">
              <SearchOutlined />
            </InputAdornment>
          }
        />

        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          {["All", "Active", "On Leave", "Inactive"].map((f) => (
            <Chip
              key={f}
              label={f}
              onClick={() => setFilter(f)}
              sx={{
                fontSize: 12,
                height: 28,
                bgcolor: filter === f ? "#1F2937" : "#F3F4F6",
                color: filter === f ? "#fff" : "#374151",
              }}
            />
          ))}
        </Stack>
      </Card>

      {/* GRID */}
      <Box
        sx={{
          mt: 1.5,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 1.5,
        }}
      >
        {filtered.length ? (
          filtered.map((s, i) => (
            <Card key={i} sx={{ p: 2, border: "1px solid #E9E1DB" }}>
              {/* TOP */}
              <Stack direction="row" justifyContent="space-between">
                <Stack direction="row" spacing={1.5}>
                  <Avatar src={s.profilePhotoUrl}>
                    {s.fullName?.charAt(0)}
                  </Avatar>

                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                      {s.fullName}
                    </Typography>

                    <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>
                      {s.roleTitle}
                    </Typography>
                  </Box>
                </Stack>

                <Chip
                  label={mapStatus(s.status)}
                  size="small"
                  sx={{
                    fontSize: 11,
                    bgcolor: getStatusBg(s.status),
                    color: getStatusColor(s.status),
                  }}
                />
              </Stack>

              {/* CONTACT */}
              <Typography sx={{ mt: 1, fontSize: 12 }}>{s.email}</Typography>

              <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>
                {s.phone} • {s.location || "—"}
              </Typography>

              {/* SPECIALTIES */}
              <Stack
                direction="row"
                spacing={0.5}
                sx={{ mt: 1, flexWrap: "wrap" }}
              >
                {(s.specialties || []).map((sp, i) => (
                  <Chip key={i} label={sp} size="small" sx={{ fontSize: 11 }} />
                ))}
              </Stack>

              {/* STATS */}
              <Typography sx={{ mt: 1, fontSize: 12 }}>
                Projects: {s.assignedProjectIds?.length || 0}
              </Typography>

              <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>
                Last active: {formatTime(s.lastActiveAt)}
              </Typography>

              {/* ACTIONS */}
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => {
                    setSelectedStaff(s);
                    setAssignOpen(true);
                  }}
                  sx={{ height: 32, fontSize: 12.5 }}
                >
                  Assign
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  sx={{ height: 32, fontSize: 12.5 }}
                >
                  {s.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </Button>
              </Stack>
            </Card>
          ))
        ) : (
          <Empty />
        )}
      </Box>

      {/* MODAL */}
      <AddStaffModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={fetch}
      />
      <AssignProjectModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        staff={selectedStaff}
        onSuccess={fetch}
      />
    </Box>
  );
}

/* COMPONENTS */

function StatCard({ label, value }) {
  return (
    <Card sx={{ p: 2, border: "1px solid #E9E1DB" }}>
      <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>{label}</Typography>
      <Typography sx={{ fontSize: 22, fontWeight: 700 }}>{value}</Typography>
    </Card>
  );
}

/* HELPERS */

function mapStatus(s) {
  if (s === "ACTIVE") return "Active";
  if (s === "INACTIVE") return "Inactive";
  if (s === "ON_LEAVE") return "On Leave";
  return s;
}

function getStatusBg(s) {
  if (s === "ACTIVE") return "#DCFCE7";
  if (s === "INACTIVE") return "#F3F4F6";
  if (s === "ON_LEAVE") return "#FEF3C7";
}

function getStatusColor(s) {
  if (s === "ACTIVE") return "#16A34A";
  if (s === "INACTIVE") return "#6B7280";
  if (s === "ON_LEAVE") return "#CA8A04";
}

function formatTime(date) {
  if (!date) return "—";
  return "Recently";
}

function Empty() {
  return (
    <Box
      sx={{
        height: 160,
        border: "1px dashed #E5DED7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#B0B5BE",
      }}
    >
      No staff found
    </Box>
  );
}
