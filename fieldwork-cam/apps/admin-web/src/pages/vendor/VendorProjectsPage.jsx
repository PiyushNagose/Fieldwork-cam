import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  CalendarTodayOutlined,
  SearchOutlined,
  SortOutlined,
} from "@mui/icons-material";
import { getProjectsApi } from "../../api/project.api";
import { getStaffApi } from "../../api/staff.api";
import { useAuth } from "../../auth/AuthContext";
import VendorAssignStaffDialog from "./VendorAssignStaffDialog";

const FILTERS = ["All", "New", "In Progress", "Submitted", "Completed", "Overdue"];

export default function VendorProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState([]);
  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [assignProject, setAssignProject] = useState(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchProjectsPageData = async () => {
      try {
        setLoading(true);
        setError("");

        const [projectsRes, staffRes] = await Promise.all([
          getProjectsApi(),
          getStaffApi(),
        ]);

        const allProjects = projectsRes?.data || projectsRes || [];
        const allStaff = staffRes?.data || staffRes || [];

        setProjects(
          (Array.isArray(allProjects) ? allProjects : []).filter(
            (item) => item.assignedVendorAuthUserId === user?.authUserId,
          ),
        );
        setStaff(Array.isArray(allStaff) ? allStaff : []);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            "Failed to load vendor projects",
        );
        setProjects([]);
        setStaff([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectsPageData();
  }, [user?.authUserId]);

  const counts = useMemo(
    () => ({
      All: projects.length,
      New: projects.filter((item) => item.status === "New").length,
      "In Progress": projects.filter((item) => item.status === "In Progress").length,
      Submitted: projects.filter((item) => item.status === "Submitted").length,
      Completed: projects.filter((item) =>
        ["Completed", "Approved"].includes(item.status),
      ).length,
      Overdue: projects.filter((item) => isOverdue(item)).length,
    }),
    [projects],
  );

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return projects.filter((item) => {
      const matchesSearch = query
        ? [
            item.title,
            item.address,
            item.workOrderNumber,
            item.serviceType,
            item.clientName,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query)
        : true;

      const matchesFilter =
        filter === "All"
          ? true
          : filter === "Completed"
            ? ["Completed", "Approved"].includes(item.status)
            : filter === "Overdue"
              ? isOverdue(item)
              : item.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [filter, projects, search]);

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
      <Card
        sx={{
          p: 2,
          borderRadius: 1,
          border: "1px solid #E9E1DB",
          boxShadow: "none",
          bgcolor: "#FFFFFF",
        }}
      >
        <Stack
          direction={{ xs: "column", xl: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", xl: "center" }}
          spacing={1.5}
        >
          <OutlinedInput
            fullWidth
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by address, city, work type, or project ID..."
            startAdornment={
              <InputAdornment position="start">
                <SearchOutlined sx={{ fontSize: 18, color: "#B3ACA5" }} />
              </InputAdornment>
            }
            sx={{
              height: 40,
              bgcolor: "#FFFFFF",
              borderRadius: 1,
              fontSize: 13,
              maxWidth: { xs: "100%", xl: 560 },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E9E1DB" },
            }}
          />

          <Button
            startIcon={<SortOutlined sx={{ fontSize: 16 }} />}
            sx={{
              alignSelf: { xs: "flex-start", xl: "center" },
              minHeight: 30,
              px: 1.25,
              borderRadius: 1,
              border: "1px solid #E8E1DA",
              bgcolor: "#FFFFFF",
              color: "#8D8781",
              fontSize: 11.5,
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            Sort: Due Date
          </Button>
        </Stack>

        <Stack
          direction="row"
          spacing={0.75}
          sx={{ mt: 1.5, overflowX: "auto", pb: 0.25 }}
        >
          {FILTERS.map((item) => {
            const active = filter === item;
            return (
              <Button
                key={item}
                onClick={() => setFilter(item)}
                sx={{
                  minWidth: "fit-content",
                  px: 1.15,
                  minHeight: 28,
                  borderRadius: 999,
                  border: "1px solid #E9E1DB",
                  bgcolor: active ? "#D9C2B7" : "#FFFFFF",
                  color: active ? "#FFFFFF" : "#7C7F86",
                  fontSize: 11.5,
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": {
                    bgcolor: active ? "#D1B7AB" : "#F8F3EF",
                  },
                }}
              >
                {item} {counts[item]}
              </Button>
            );
          })}
        </Stack>
      </Card>

      {error ? (
        <Alert severity="error" sx={{ mt: 1.5, borderRadius: 1 }}>
          {error}
        </Alert>
      ) : null}

      {success ? (
        <Alert
          severity="success"
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
        {filteredProjects.length ? (
          filteredProjects.map((project) => (
            <ProjectCard
              key={project._id || project.id}
              project={project}
              staff={staff}
              onViewDetails={() =>
                navigate(`/vendor/projects/${project._id || project.id}`)
              }
              onAssignStaff={() => setAssignProject(project)}
            />
          ))
        ) : (
          <Box
            sx={{
              minHeight: 220,
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
            No projects found
          </Box>
        )}
      </Box>

      <VendorAssignStaffDialog
        open={Boolean(assignProject)}
        project={assignProject}
        staff={staff}
        onClose={() => setAssignProject(null)}
        onSuccess={async (message) => {
          try {
            setLoading(true);
            const [projectsRes, staffRes] = await Promise.all([
              getProjectsApi(),
              getStaffApi(),
            ]);
            const allProjects = projectsRes?.data || projectsRes || [];
            const allStaff = staffRes?.data || staffRes || [];
            setProjects(
              (Array.isArray(allProjects) ? allProjects : []).filter(
                (item) => item.assignedVendorAuthUserId === user?.authUserId,
              ),
            );
            setStaff(Array.isArray(allStaff) ? allStaff : []);
            setSuccess(message || "Staff assigned successfully.");
          } finally {
            setLoading(false);
          }
        }}
      />
    </Box>
  );
}

function ProjectCard({ project, staff, onViewDetails, onAssignStaff }) {
  const assignedStaff = getAssignedStaff(project, staff);
  const coverImage = project.coverImageUrl || "";
  const progress = Number(project.progress || 0);
  const status = mapProjectStatus(project);

  return (
    <Card
      sx={{
        borderRadius: 1,
        border: "1px solid #E9E1DB",
        boxShadow: "none",
        overflow: "hidden",
        bgcolor: "#FFFFFF",
      }}
    >
      <Box
        sx={{
          position: "relative",
          height: 190,
          backgroundImage: coverImage ? `url(${coverImage})` : gradientCover(project),
          backgroundSize: "cover",
          backgroundPosition: "center",
          bgcolor: "#D7DCE2",
        }}
      >
        <Chip
          label={status.label}
          size="small"
          sx={{
            position: "absolute",
            top: 10,
            left: 10,
            height: 22,
            borderRadius: 999,
            bgcolor: status.bg,
            color: status.color,
            fontSize: 10.5,
            fontWeight: 700,
          }}
        />

        <Chip
          label={project.workOrderNumber || "PRJ"}
          size="small"
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            height: 22,
            borderRadius: 999,
            bgcolor: "rgba(255,255,255,0.82)",
            color: "#4B5563",
            fontSize: 10.5,
            fontWeight: 700,
          }}
        />

        <Chip
          label={`${progressLabel(project)}`}
          size="small"
          sx={{
            position: "absolute",
            right: 10,
            bottom: 10,
            height: 22,
            borderRadius: 999,
            bgcolor: "rgba(34,39,47,0.66)",
            color: "#FFFFFF",
            fontSize: 10.5,
            fontWeight: 700,
          }}
        />
      </Box>

      <Box sx={{ p: 1.6 }}>
        <Typography sx={{ fontSize: 10.5, color: "#6366F1", fontWeight: 700 }}>
          {project.serviceType || "Project"}
        </Typography>

        <Typography
          sx={{
            mt: 0.55,
            fontSize: 15,
            fontWeight: 700,
            color: "#1F2937",
            lineHeight: 1.25,
          }}
        >
          {project.address || project.title || "Untitled Project"}
        </Typography>

        <Typography
          sx={{ mt: 0.45, fontSize: 11.5, color: "#9CA3AF", fontWeight: 500 }}
        >
          {shortLocation(project.address)}
        </Typography>

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mt: 0.9 }}
        >
          <Stack direction="row" spacing={0.7} alignItems="center">
            <CalendarTodayOutlined sx={{ fontSize: 13, color: "#B0B5BE" }} />
            <Typography sx={{ fontSize: 11.5, color: "#9CA3AF", fontWeight: 500 }}>
              {formatDate(project.dueDate || project.createdAt)}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={0.6} alignItems="center">
            {assignedStaff.length ? (
              <>
                <Avatar
                  src={assignedStaff[0].profilePhotoUrl || ""}
                  sx={{
                    width: 18,
                    height: 18,
                    bgcolor: "#E9CFC2",
                    color: "#7C6258",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {assignedStaff[0].fullName?.charAt(0) || "S"}
                </Avatar>
                <Typography
                  sx={{ fontSize: 11.5, color: "#9CA3AF", fontWeight: 500 }}
                >
                  {assignedStaff[0].fullName}
                </Typography>
              </>
            ) : (
              <Typography
                sx={{ fontSize: 11.5, color: "#B0B5BE", fontWeight: 500 }}
              >
                Unassigned
              </Typography>
            )}
          </Stack>
        </Stack>

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mt: 1.2 }}
        >
          <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>
            Photo Progress
          </Typography>
          <Typography sx={{ fontSize: 11, color: "#8C8C8C", fontWeight: 700 }}>
            {progress}%
          </Typography>
        </Stack>

        <Box
          sx={{
            mt: 0.5,
            height: 4,
            borderRadius: 999,
            bgcolor: "#EFE8E2",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              width: `${progress}%`,
              height: "100%",
              borderRadius: 999,
              bgcolor: progressColor(project.status),
            }}
          />
        </Box>

        <Stack direction="row" spacing={1} sx={{ mt: 1.35 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={onViewDetails}
            sx={actionButtonSx}
          >
            View Details
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={onAssignStaff}
            sx={secondaryActionButtonSx}
          >
            Assign Staff
          </Button>
        </Stack>
      </Box>
    </Card>
  );
}

function mapProjectStatus(project) {
  if (isOverdue(project)) {
    return {
      label: "Overdue",
      bg: "rgba(254,226,226,0.92)",
      color: "#EF4444",
    };
  }

  const status = project.status;
  if (status === "New") return { label: "New", bg: "rgba(238,244,255,0.92)", color: "#4F83FF" };
  if (status === "In Progress") {
    return {
      label: "In Progress",
      bg: "rgba(255,245,221,0.92)",
      color: "#F59E0B",
    };
  }
  if (status === "Submitted") {
    return {
      label: "Submitted",
      bg: "rgba(243,232,255,0.92)",
      color: "#9B5DE5",
    };
  }
  return { label: "Completed", bg: "rgba(234,251,241,0.92)", color: "#10B981" };
}

function getAssignedStaff(project, staffList) {
  const assigned = Array.isArray(project.assignedStaff) ? project.assignedStaff : [];
  return assigned
    .map((entry) => staffList.find((item) => item.authUserId === entry.staffId))
    .filter(Boolean);
}

function shortLocation(address = "") {
  if (!address) return "No location";
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
  return address;
}

function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isOverdue(project) {
  if (!project?.dueDate) return false;
  const dueDate = new Date(project.dueDate);
  if (Number.isNaN(dueDate.getTime())) return false;
  return (
    dueDate.getTime() < Date.now() &&
    !["Completed", "Approved"].includes(project.status)
  );
}

function gradientCover(project) {
  const key = String(project?.serviceType || project?.title || "project").toLowerCase();
  if (key.includes("interior")) {
    return "linear-gradient(135deg, #f2d0b2 0%, #d68d68 42%, #8ecae6 100%)";
  }
  if (key.includes("survey")) {
    return "linear-gradient(135deg, #4b5563 0%, #1f2937 45%, #9bd2ff 100%)";
  }
  if (key.includes("solar")) {
    return "linear-gradient(135deg, #9ca34a 0%, #d0dc72 38%, #5f7f3f 100%)";
  }
  if (key.includes("warehouse")) {
    return "linear-gradient(135deg, #7c4a2d 0%, #b98a55 42%, #e7d4c0 100%)";
  }
  return "linear-gradient(135deg, #9ecdf3 0%, #cad6ea 38%, #7a8aa6 100%)";
}

function progressColor(status) {
  if (status === "Submitted") return "#A855F7";
  if (status === "In Progress") return "#F59E0B";
  if (["Completed", "Approved"].includes(status)) return "#10B981";
  if (status === "New") return "#38BDF8";
  return "#E9CFC2";
}

function progressLabel(project) {
  const total = 50;
  const completed = Math.max(0, Math.round((Number(project.progress || 0) / 100) * total));
  return `${completed}/${total}`;
}

const actionButtonSx = {
  minHeight: 32,
  borderRadius: 1,
  bgcolor: "#E9CFC2",
  color: "#6F554B",
  boxShadow: "none",
  fontSize: 12,
  fontWeight: 600,
  textTransform: "none",
  "&:hover": {
    bgcolor: "#DFC1B3",
    boxShadow: "none",
  },
};

const secondaryActionButtonSx = {
  minHeight: 32,
  borderRadius: 1,
  borderColor: "#E9E1DB",
  color: "#7C7F86",
  fontSize: 12,
  fontWeight: 600,
  textTransform: "none",
  "&:hover": {
    borderColor: "#DED3CB",
    bgcolor: "#FCFAF8",
  },
};
