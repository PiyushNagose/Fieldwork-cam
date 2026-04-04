import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  MenuItem,
  OutlinedInput,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  CalendarTodayOutlined,
  CloseOutlined,
  FilterListOutlined,
  LocationOnOutlined,
  SearchOutlined,
} from "@mui/icons-material";
import {
  assignStaffToProjectApi,
  getProjectsApi,
  removeStaffFromProjectApi,
} from "../../api/project.api";
import {
  assignProjectToStaffApi,
  removeProjectFromStaffApi,
} from "../../api/staff.api";

const STATUS_OPTIONS = ["ALL", "New", "In Progress", "Submitted", "Completed"];
const PRIORITY_OPTIONS = ["ALL", "High", "Medium", "Low"];

const getProjectAssignedIdsForStaff = (projects = [], staffAuthUserId = "") =>
  projects
    .filter((project) =>
      Array.isArray(project?.assignedStaff)
        ? project.assignedStaff.some(
            (item) => String(item?.staffId || "") === String(staffAuthUserId || ""),
          )
        : false,
    )
    .map((project) => project._id)
    .filter(Boolean);

const getUniqueIds = (...groups) =>
  [...new Set(groups.flat().filter(Boolean).map((item) => String(item)))];

export default function AssignProjectModal({
  open,
  onClose,
  staff,
  onSuccess,
}) {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await getProjectsApi();
        const data = res?.data || res || [];
        const nextProjects = Array.isArray(data) ? data : [];
        const projectAssignedIds = getProjectAssignedIdsForStaff(
          nextProjects,
          staff?.authUserId,
        );

        setProjects(nextProjects);
        setSelected(
          getUniqueIds(staff?.assignedProjectIds || [], projectAssignedIds),
        );
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            "Failed to load projects",
        );
        setProjects([]);
        setSelected(getUniqueIds(staff?.assignedProjectIds || []));
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchProjects();
    }
  }, [open, staff?.assignedProjectIds, staff?.authUserId]);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return projects.filter((item) => {
      const matchesSearch = query
        ? [
            item.title,
            item.workOrderNumber,
            item.serviceType,
            item.address,
            item.clientName,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query)
        : true;

      const matchesStatus =
        statusFilter === "ALL" ? true : item.status === statusFilter;
      const matchesPriority =
        priorityFilter === "ALL" ? true : item.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [priorityFilter, projects, search, statusFilter]);

  const projectAssignedIds = useMemo(
    () => getProjectAssignedIdsForStaff(projects, staff?.authUserId),
    [projects, staff?.authUserId],
  );

  const staffAssignedIds = useMemo(
    () => getUniqueIds(staff?.assignedProjectIds || []),
    [staff?.assignedProjectIds],
  );

  const currentAssignedIds = useMemo(
    () => getUniqueIds(projectAssignedIds, staffAssignedIds),
    [projectAssignedIds, staffAssignedIds],
  );

  const toggleSelect = (id) => {
    const normalizedId = String(id);
    setSelected((prev) =>
      prev.includes(normalizedId)
        ? prev.filter((item) => item !== normalizedId)
        : [...prev, normalizedId],
    );
  };

  const handleAssign = async () => {
    if (!staff?.authUserId) return;

    try {
      setSubmitting(true);
      setError("");

      const projectCurrent = new Set(projectAssignedIds.map(String));
      const staffCurrent = new Set(staffAssignedIds.map(String));
      const next = new Set(selected.map(String));
      const assignToProjectIds = [...next].filter((item) => !projectCurrent.has(item));
      const assignToStaffIds = [...next].filter((item) => !staffCurrent.has(item));
      const removeFromProjectIds = [...projectCurrent].filter((item) => !next.has(item));
      const removeFromStaffIds = [...staffCurrent].filter((item) => !next.has(item));

      await Promise.all(
        assignToProjectIds.map((projectId) =>
          assignStaffToProjectApi(projectId, staff.authUserId),
        ),
      );

      await Promise.all(
        assignToStaffIds.map((projectId) =>
          assignProjectToStaffApi(staff.authUserId, projectId),
        ),
      );

      await Promise.all(
        removeFromProjectIds.map((projectId) =>
          removeStaffFromProjectApi(projectId, staff.authUserId),
        ),
      );

      await Promise.all(
        removeFromStaffIds.map((projectId) =>
          removeProjectFromStaffApi(staff.authUserId, projectId),
        ),
      );

      const messages = [];
      const addedCount = getUniqueIds(assignToProjectIds, assignToStaffIds).length;
      const removedCount = getUniqueIds(
        removeFromProjectIds,
        removeFromStaffIds,
      ).length;

      if (addedCount) {
        messages.push(
          `${addedCount} project${addedCount === 1 ? "" : "s"} assigned`,
        );
      }
      if (removedCount) {
        messages.push(
          `${removedCount} project${removedCount === 1 ? "" : "s"} removed`,
        );
      }

      onSuccess?.(
        messages.length
          ? `${messages.join(" and ")} for ${staff?.fullName || "staff member"}.`
          : "No assignment changes were made.",
      );
      onClose?.();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to update project assignments",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 1,
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          px: 2.4,
          py: 2,
          bgcolor: "#E7D3C8",
          borderBottom: "1px solid #E5DED7",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              src={staff?.profilePhotoUrl || ""}
              sx={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                bgcolor: "#F4E5DC",
                color: "#6F554B",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {staff?.fullName?.charAt(0) || "S"}
            </Avatar>

            <Box>
              <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#1F2937" }}>
                Assign Projects to {staff?.fullName || "Staff Member"}
              </Typography>
              <Typography
                sx={{ mt: 0.35, fontSize: 12.5, color: "#5F6368", fontWeight: 500 }}
              >
                {staff?.roleTitle || "Lead Photographer"} • Currently assigned to{" "}
                {currentAssignedIds.length} projects
              </Typography>
            </Box>
          </Stack>

          <IconButton onClick={onClose} size="small" sx={{ color: "#374151" }}>
            <CloseOutlined sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </Box>

      <DialogContent sx={{ px: 0, py: 0 }}>
        <Box sx={{ p: 2 }}>
          <OutlinedInput
            fullWidth
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects by name, code, type, or location..."
            startAdornment={
              <InputAdornment position="start">
                <SearchOutlined sx={{ fontSize: 18, color: "#9CA3AF" }} />
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
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
            spacing={1.2}
            sx={{ mt: 1.4 }}
          >
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Stack direction="row" spacing={0.7} alignItems="center">
                <FilterListOutlined sx={{ fontSize: 16, color: "#6B7280" }} />
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#6B7280" }}>
                  Filters:
                </Typography>
              </Stack>

              <TextField
                select
                size="small"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                sx={filterFieldSx}
              >
                {STATUS_OPTIONS.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item === "ALL" ? "All Statuses" : item}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                size="small"
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                sx={filterFieldSx}
              >
                {PRIORITY_OPTIONS.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item === "ALL" ? "All Priorities" : item}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Typography sx={{ fontSize: 12.5, color: "#6B7280", fontWeight: 600 }}>
              {selected.length} of {projects.length} selected
            </Typography>
          </Stack>

          {error ? (
            <Alert severity="error" sx={{ mt: 1.5, borderRadius: 1 }}>
              {error}
            </Alert>
          ) : null}
        </Box>

        <Box
          sx={{
            maxHeight: 400,
            overflowY: "auto",
            px: 2,
            pb: 2,
          }}
        >
          <Stack spacing={1.5}>
            {loading ? (
              <Box
                sx={{
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
                Loading projects...
              </Box>
            ) : filteredProjects.length ? (
              filteredProjects.map((project) => {
                const checked = selected.includes(String(project._id));
                return (
                  <Box
                    key={project._id}
                    onClick={() => toggleSelect(project._id)}
                    sx={{
                      border: "1px solid #CFC0B4",
                      borderRadius: 1,
                      px: 1.4,
                      py: 1.35,
                      bgcolor: checked ? "#FFFCFA" : "#FFFFFF",
                      cursor: "pointer",
                      boxShadow: "0 1px 2px rgba(18, 24, 40, 0.05)",
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" spacing={1.5}>
                      <Stack direction="row" spacing={1}>
                        <Checkbox
                          checked={checked}
                          onChange={() => toggleSelect(project._id)}
                          sx={{ mt: -0.6 }}
                        />

                        <Box>
                          <Typography
                            sx={{ fontSize: 14, fontWeight: 700, color: "#1F2937" }}
                          >
                            {project.title || project.address || "Untitled Project"}
                          </Typography>

                          <Stack
                            direction="row"
                            spacing={0.9}
                            alignItems="center"
                            sx={{ mt: 0.55, flexWrap: "wrap" }}
                          >
                            <Typography
                              sx={{ fontSize: 12, color: "#4F46E5", fontWeight: 700 }}
                            >
                              {project.workOrderNumber || "PRJ"}
                            </Typography>
                            <Typography
                              sx={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}
                            >
                              • {project.serviceType || "General"}
                            </Typography>
                          </Stack>

                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ mt: 0.8, flexWrap: "wrap" }}
                          >
                            <Stack direction="row" spacing={0.45} alignItems="center">
                              <LocationOnOutlined
                                sx={{ fontSize: 13, color: "#9CA3AF" }}
                              />
                              <Typography
                                sx={{
                                  fontSize: 12,
                                  color: "#6B7280",
                                  fontWeight: 500,
                                }}
                              >
                                {shortLocation(project.address)}
                              </Typography>
                            </Stack>

                            <Stack direction="row" spacing={0.45} alignItems="center">
                              <CalendarTodayOutlined
                                sx={{ fontSize: 13, color: "#9CA3AF" }}
                              />
                              <Typography
                                sx={{
                                  fontSize: 12,
                                  color: "#6B7280",
                                  fontWeight: 500,
                                }}
                              >
                                {formatDate(project.dueDate || project.createdAt)}
                              </Typography>
                            </Stack>

                            <Typography
                              sx={{
                                fontSize: 12,
                                color: mapStatus(project.status).color,
                                fontWeight: 700,
                              }}
                            >
                              • {mapStatus(project.status).label}
                            </Typography>
                          </Stack>

                          <Typography
                            sx={{
                              mt: 0.6,
                              fontSize: 12,
                              color: "#6B7280",
                              fontWeight: 500,
                            }}
                          >
                            {(project.assignedStaff || []).length} staff members assigned
                          </Typography>
                        </Box>
                      </Stack>

                      <Box
                        sx={{
                          minWidth: 72,
                          px: 1,
                          py: 0.55,
                          borderRadius: 1,
                          bgcolor: priorityStyle(project.priority).bg,
                          color: priorityStyle(project.priority).color,
                          fontSize: 12,
                          fontWeight: 700,
                          textAlign: "center",
                        }}
                      >
                        {project.priority || "Medium"}
                      </Box>
                    </Stack>
                  </Box>
                );
              })
            ) : (
              <Box
                sx={{
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
                No projects found
              </Box>
            )}
          </Stack>
        </Box>

        <Stack
          direction="row"
          spacing={1.2}
          sx={{
            p: 2,
            borderTop: "1px solid #EEE7E2",
            bgcolor: "#FFFFFF",
          }}
        >
          <Button fullWidth variant="outlined" onClick={onClose} sx={cancelButtonSx}>
            Cancel
          </Button>

          <Button
            fullWidth
            variant="contained"
            onClick={handleAssign}
            disabled={submitting}
            sx={submitButtonSx}
          >
            Save Project Assignments
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function shortLocation(address = "") {
  if (!address) return "No location";
  const parts = address
    .split(",")
    .map((item) => item.trim())
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

function priorityStyle(priority = "") {
  if (priority === "High" || priority === "Urgent") {
    return { bg: "#FEF2F2", color: "#EF4444" };
  }
  if (priority === "Medium") {
    return { bg: "#FFF8E6", color: "#D97706" };
  }
  return { bg: "#F3F4F6", color: "#6B7280" };
}

function mapStatus(status = "") {
  if (status === "In Progress") return { label: "In Progress", color: "#2563EB" };
  if (status === "Submitted") return { label: "Submitted", color: "#8B5CF6" };
  if (["Completed", "Approved"].includes(status)) {
    return { label: "Completed", color: "#10B981" };
  }
  return { label: status || "New", color: "#6B7280" };
}

const filterFieldSx = {
  minWidth: 140,
  "& .MuiOutlinedInput-root": {
    height: 32,
    borderRadius: 1,
    fontSize: 12.5,
    bgcolor: "#FFFFFF",
  },
};

const cancelButtonSx = {
  minHeight: 40,
  borderRadius: 1,
  borderColor: "#E8E1DA",
  color: "#6B7280",
  fontSize: 12.5,
  fontWeight: 600,
  textTransform: "none",
};

const submitButtonSx = {
  minHeight: 40,
  borderRadius: 1,
  bgcolor: "#E9CFC2",
  color: "#6F554B",
  boxShadow: "none",
  fontSize: 12.5,
  fontWeight: 700,
  textTransform: "none",
  "&:hover": {
    bgcolor: "#DFC1B3",
    boxShadow: "none",
  },
  "&.Mui-disabled": {
    bgcolor: "#E6DDD7",
    color: "#A39D96",
  },
};
