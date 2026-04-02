import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  Chip,
  CircularProgress,
  Stack,
  Typography,
  OutlinedInput,
  InputAdornment,
  Button,
} from "@mui/material";
import {
  SearchOutlined,
  LocationOnOutlined,
  CalendarTodayOutlined,
} from "@mui/icons-material";
import { getProjectsApi } from "../../api/project.api";
import { useAuth } from "../../auth/AuthContext";

export default function VendorProjectsPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getProjectsApi();
        const all = res?.data || res || [];

        setProjects(
          all.filter((p) => p.assignedVendorAuthUserId === user?.authUserId),
        );
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  // 🔷 FILTER COUNTS
  const counts = useMemo(() => {
    return {
      All: projects.length,
      New: projects.filter((p) => p.status === "New").length,
      "In Progress": projects.filter((p) => p.status === "In Progress").length,
      Submitted: projects.filter((p) => p.status === "Submitted").length,
      Completed: projects.filter((p) =>
        ["Completed", "Approved"].includes(p.status),
      ).length,
    };
  }, [projects]);

  const filtered = useMemo(() => {
    return projects
      .filter((p) =>
        (p.title || "").toLowerCase().includes(search.toLowerCase()),
      )
      .filter((p) => (filter === "All" ? true : p.status === filter));
  }, [projects, search, filter]);

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
      <Typography sx={{ fontSize: 28, fontWeight: 700 }}>
        FieldWork Cam
      </Typography>

      {/* SEARCH + FILTER */}
      <Card sx={{ mt: 2.25, p: 2, border: "1px solid #E9E1DB" }}>
        <OutlinedInput
          fullWidth
          size="small"
          placeholder="Search by address, city, work type, or project ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startAdornment={
            <InputAdornment position="start">
              <SearchOutlined sx={{ fontSize: 18 }} />
            </InputAdornment>
          }
        />

        {/* FILTER CHIPS */}
        <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap" }}>
          {Object.keys(counts).map((key) => (
            <Chip
              key={key}
              label={`${key} ${counts[key]}`}
              onClick={() => setFilter(key)}
              sx={{
                fontSize: 12,
                height: 28,
                bgcolor: filter === key ? "#1F2937" : "#F3F4F6",
                color: filter === key ? "#fff" : "#374151",
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
          filtered.map((p, i) => (
            <Card
              key={i}
              sx={{
                border: "1px solid #E9E1DB",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              {/* IMAGE */}
              <Box
                sx={{
                  height: 160,
                  bgcolor: "#E5E7EB",
                  position: "relative",
                }}
              >
                {/* STATUS BADGE */}
                <Chip
                  label={p.status}
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    fontSize: 11,
                  }}
                />

                {/* PROJECT ID */}
                <Chip
                  label={p.code || "PRJ"}
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    fontSize: 11,
                  }}
                />
              </Box>

              {/* CONTENT */}
              <Box sx={{ p: 2 }}>
                <Typography
                  sx={{
                    fontSize: 11,
                    color: "#6366F1",
                    fontWeight: 600,
                  }}
                >
                  {p.type || "Work Type"}
                </Typography>

                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                  {p.title}
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <LocationOnOutlined sx={{ fontSize: 14 }} />
                  <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>
                    {p.location || "—"}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} sx={{ mt: 0.3 }}>
                  <CalendarTodayOutlined sx={{ fontSize: 14 }} />
                  <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>
                    {p.createdAt || ""}
                  </Typography>
                </Stack>

                {/* PROGRESS */}
                <Typography sx={{ fontSize: 11, mt: 1 }}>
                  Photo Progress
                </Typography>

                <Box
                  sx={{
                    mt: 0.3,
                    height: 6,
                    bgcolor: "#F1EBE6",
                    borderRadius: 3,
                  }}
                >
                  <Box
                    sx={{
                      width: `${p.progress || 0}%`,
                      height: "100%",
                      bgcolor: getProgressColor(p.status),
                      borderRadius: 3,
                    }}
                  />
                </Box>

                {/* ACTIONS */}
                <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{
                      height: 32,
                      fontSize: 12.5,
                      bgcolor: "#CBB8AD",
                      color: "#000",
                      boxShadow: "none",
                    }}
                  >
                    View Details
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{
                      height: 32,
                      fontSize: 12.5,
                      borderColor: "#E9E1DB",
                    }}
                  >
                    Assign Staff
                  </Button>
                </Stack>
              </Box>
            </Card>
          ))
        ) : (
          <EmptyState />
        )}
      </Box>
    </Box>
  );
}

/* HELPERS */

function getProgressColor(status) {
  switch (status) {
    case "In Progress":
      return "#F59E0B";
    case "Completed":
      return "#10B981";
    case "Submitted":
      return "#8B5CF6";
    default:
      return "#8C7A70";
  }
}

function EmptyState() {
  return (
    <Box
      sx={{
        height: 160,
        border: "1px dashed #E5DED7",
        borderRadius: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        color: "#B0B5BE",
      }}
    >
      No projects found
    </Box>
  );
}
