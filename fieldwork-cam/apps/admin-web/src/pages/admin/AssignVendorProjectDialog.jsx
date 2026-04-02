import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  Stack,
  Typography,
} from "@mui/material";
import {
  CalendarMonthOutlined,
  CloseOutlined,
  LocationOnOutlined,
  SearchOutlined,
  WorkOutlineOutlined,
} from "@mui/icons-material";
import { getProjectsApi, assignVendorToProjectApi } from "../../api/project.api";

export default function AssignVendorProjectDialog({
  open,
  vendor,
  onClose,
  onAssigned,
}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;

    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await getProjectsApi();
        const data = res?.data || res || [];
        setProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load projects",
        );
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [open]);

  const visibleProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return projects
      .filter(
        (item) =>
          !item.assignedVendorAuthUserId ||
          item.assignedVendorAuthUserId === vendor?.authUserId,
      )
      .filter((item) => {
        if (!query) return true;

        return [
          item.title,
          item.workOrderNumber,
          item.address,
          item.serviceType,
          item.clientName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        const aAssigned = a.assignedVendorAuthUserId === vendor?.authUserId ? 1 : 0;
        const bAssigned = b.assignedVendorAuthUserId === vendor?.authUserId ? 1 : 0;
        return bAssigned - aAssigned;
      });
  }, [projects, search, vendor?.authUserId]);

  const handleAssign = async (projectId) => {
    if (!vendor?.authUserId || !projectId) return;

    try {
      setSubmittingId(projectId);
      setError("");
      await assignVendorToProjectApi(projectId, vendor.authUserId);
      onAssigned?.();
      onClose?.();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to assign project",
      );
    } finally {
      setSubmittingId("");
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
          borderRadius: 1.5,
          overflow: "hidden",
          bgcolor: "#FFFFFF",
        },
      }}
    >
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2.25,
          borderBottom: "1px solid #EFE5DE",
          background: "linear-gradient(180deg, #F3E4DA 0%, #F6EFEA 100%)",
        }}
      >
        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#1F2937" }}>
              Assign Project
            </Typography>
            <Typography
              sx={{ mt: 0.55, fontSize: 12.5, color: "#8F8A84", fontWeight: 500 }}
            >
              Select a project to assign to {vendor?.companyName || "this vendor"}.
            </Typography>
          </Box>

          <IconButton onClick={onClose} size="small" sx={{ color: "#8F8A84" }}>
            <CloseOutlined sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </Box>

      <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
        <Box
          sx={{
            height: 40,
            display: "flex",
            alignItems: "center",
            border: "1px solid #E8E0DA",
            borderRadius: 1,
            bgcolor: "#FBF8F5",
            px: 1.5,
          }}
        >
          <InputAdornment position="start" sx={{ mr: 1 }}>
            <SearchOutlined sx={{ fontSize: 17, color: "#B4ADA6" }} />
          </InputAdornment>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by project ID, address, service, or client..."
            style={{
              border: 0,
              outline: "none",
              width: "100%",
              background: "transparent",
              fontSize: 13,
              color: "#4B5563",
            }}
          />
        </Box>

        {error ? (
          <Alert severity="error" sx={{ mt: 2, borderRadius: 1 }}>
            {error}
          </Alert>
        ) : null}

        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 220 }} spacing={2}>
            <CircularProgress />
            <Typography color="text.secondary">Loading projects...</Typography>
          </Stack>
        ) : visibleProjects.length ? (
          <Stack spacing={1.4} sx={{ mt: 2.2 }}>
            {visibleProjects.map((project) => {
              const alreadyAssigned =
                project.assignedVendorAuthUserId === vendor?.authUserId;

              return (
                <Box
                  key={project._id || project.id}
                  sx={{
                    border: "1px solid #E9E1DB",
                    borderRadius: 1,
                    bgcolor: "#FFFFFF",
                    p: 2,
                  }}
                >
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    spacing={2}
                    alignItems={{ xs: "flex-start", md: "center" }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: "#1F2937",
                          lineHeight: 1.25,
                        }}
                      >
                        {project.title || "Untitled Project"}
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={1.1}
                        alignItems="center"
                        flexWrap="wrap"
                        useFlexGap
                        sx={{ mt: 0.8 }}
                      >
                        <Typography
                          sx={{ fontSize: 12, fontWeight: 700, color: "#6366F1" }}
                        >
                          {project.workOrderNumber || "-"}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>
                          {project.serviceType || "General Service"}
                        </Typography>
                      </Stack>

                      <Stack
                        direction="row"
                        spacing={1.2}
                        flexWrap="wrap"
                        useFlexGap
                        sx={{ mt: 1.1 }}
                      >
                        <Stack direction="row" spacing={0.45} alignItems="center">
                          <LocationOnOutlined sx={{ fontSize: 13, color: "#B0B5BE" }} />
                          <Typography sx={{ fontSize: 12, color: "#6B7280" }}>
                            {project.address || "-"}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.45} alignItems="center">
                          <CalendarMonthOutlined sx={{ fontSize: 13, color: "#B0B5BE" }} />
                          <Typography sx={{ fontSize: 12, color: "#6B7280" }}>
                            {project.dueDate
                              ? new Date(project.dueDate).toLocaleDateString()
                              : "No due date"}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>

                    <Button
                      variant={alreadyAssigned ? "outlined" : "contained"}
                      startIcon={<WorkOutlineOutlined sx={{ fontSize: 15 }} />}
                      disabled={alreadyAssigned || submittingId === (project._id || project.id)}
                      onClick={() => handleAssign(project._id || project.id)}
                      sx={{
                        minWidth: 156,
                        borderRadius: 1,
                        textTransform: "none",
                        fontSize: 12.5,
                        fontWeight: 600,
                        boxShadow: "none",
                        bgcolor: alreadyAssigned ? "#FFFFFF" : "#8D7B72",
                        color: alreadyAssigned ? "#8F8A84" : "#FFFFFF",
                        borderColor: "#E8E0DA",
                        "&:hover": {
                          bgcolor: alreadyAssigned ? "#FFFFFF" : "#7D6B63",
                          borderColor: "#DED4CD",
                          boxShadow: "none",
                        },
                      }}
                    >
                      {alreadyAssigned
                        ? "Already Assigned"
                        : submittingId === (project._id || project.id)
                          ? "Assigning..."
                          : "Assign Project"}
                    </Button>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        ) : (
          <Box
            sx={{
              mt: 2.2,
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
            No matching projects available for assignment
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
