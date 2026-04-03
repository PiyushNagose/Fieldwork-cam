import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
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
  CalendarMonthOutlined,
  DeleteOutlineOutlined,
  EditOutlined,
  LocationOnOutlined,
  PersonOutlineOutlined,
  WorkOutlineOutlined,
} from "@mui/icons-material";
import { deleteProjectApi, getProjectByIdApi } from "../../api/project.api";
import { getVendorsApi } from "../../api/vendor.api";

export default function AdminProjectDetailsPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [vendorName, setVendorName] = useState("");

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [projectResponse, vendorsResponse] = await Promise.all([
        getProjectByIdApi(projectId),
        getVendorsApi(),
      ]);
      const data = projectResponse?.data || projectResponse || null;
      const vendors = vendorsResponse?.data || vendorsResponse || [];
      const matchedVendor = Array.isArray(vendors)
        ? vendors.find(
            (vendor) =>
              (vendor.authUserId || vendor._id || vendor.id) ===
              data?.assignedVendorAuthUserId,
          )
        : null;
      setProject(data);
      setVendorName(
        matchedVendor?.companyName ||
          matchedVendor?.fullName ||
          data?.assignedVendorName ||
          data?.assignedVendorAuthUserId ||
          "",
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load project details",
      );
      setProject(null);
      setVendorName("");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [fetchProject, projectId]);

  const handleDelete = async () => {
    if (!projectId) return;
    const confirmed = window.confirm(
      "Delete this project? This action cannot be undone.",
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      await deleteProjectApi(projectId);
      navigate("/admin/projects", { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete project",
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 320 }} spacing={2}>
        <CircularProgress />
        <Typography color="text.secondary">Loading project...</Typography>
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
      <Box sx={{ maxWidth: 1180 }}>
        <Button
          startIcon={<ArrowBackOutlined sx={{ fontSize: 17 }} />}
          onClick={() => navigate("/admin/projects")}
          sx={{
            color: "#6B7280",
            textTransform: "none",
            fontSize: 12.5,
            fontWeight: 600,
            mb: 1.2,
          }}
        >
          Back to Projects
        </Button>

        {error ? (
          <Alert severity="error" sx={{ borderRadius: 1, mb: 1.5 }}>
            {error}
          </Alert>
        ) : null}

        {!project ? (
          <Card sx={cardSx}>
            <Typography sx={{ fontSize: 14, color: "#8F8A84" }}>
              Project not found
            </Typography>
          </Card>
        ) : (
          <>
            <Card sx={{ ...cardSx, p: 2 }}>
              <Stack
                direction={{ xs: "column", lg: "row" }}
                justifyContent="space-between"
                spacing={2}
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
                    {project.title || "Untitled Project"}
                  </Typography>
                  <Typography
                    sx={{ mt: 0.45, color: "#9CA3AF", fontSize: 13, fontWeight: 500 }}
                  >
                    {project.workOrderNumber || "-"} • {project.serviceType || "General Service"}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<EditOutlined sx={{ fontSize: 15 }} />}
                    onClick={() => navigate(`/admin/projects/${projectId}/edit`)}
                    sx={outlineButtonSx}
                  >
                    Edit Project
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<DeleteOutlineOutlined sx={{ fontSize: 15 }} />}
                    onClick={handleDelete}
                    disabled={deleting}
                    sx={dangerButtonSx}
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </Button>
                </Stack>
              </Stack>

              <Box
                sx={{
                  mt: 2,
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" },
                  gap: 1.15,
                }}
              >
                <MetaCard
                  icon={<LocationOnOutlined sx={{ fontSize: 16 }} />}
                  label="Property Address"
                  value={project.address || "-"}
                />
                <MetaCard
                  icon={<PersonOutlineOutlined sx={{ fontSize: 16 }} />}
                  label="Client"
                  value={project.clientName || "-"}
                />
                <MetaCard
                  icon={<WorkOutlineOutlined sx={{ fontSize: 16 }} />}
                  label="Assigned Vendor"
                  value={vendorName || "-"}
                />
                <MetaCard
                  icon={<CalendarMonthOutlined sx={{ fontSize: 16 }} />}
                  label="Due Date"
                  value={project.dueDate ? formatDate(project.dueDate) : "-"}
                />
              </Box>
            </Card>

            <Box
              sx={{
                mt: 1.5,
                display: "grid",
                gridTemplateColumns: { xs: "1fr", xl: "1.15fr 0.85fr" },
                gap: 1.5,
              }}
            >
              <Card sx={{ ...cardSx, p: 2 }}>
                <Typography sx={sectionTitleSx}>Project Description</Typography>
                <Typography
                  sx={{ mt: 1.2, fontSize: 12.75, color: "#5A5550", lineHeight: 1.8 }}
                >
                  {project.description || "No description provided."}
                </Typography>

                <Divider sx={{ my: 1.8, borderColor: "#F0EBE6" }} />

                <Typography sx={sectionTitleSx}>Photo Checklist</Typography>
                <Stack spacing={0.85} sx={{ mt: 1.2 }}>
                  {(project.checklist || []).length ? (
                    project.checklist.map((item, index) => (
                      <Stack
                        key={`${item.title}-${index}`}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{
                          p: 1.15,
                          borderRadius: 1,
                          bgcolor: "#FBF8F6",
                          border: "1px solid #F0EBE6",
                        }}
                      >
                        <Box>
                          <Typography
                            sx={{ fontSize: 12.5, color: "#1F2937", fontWeight: 600 }}
                          >
                            {item.title}
                          </Typography>
                          <Typography
                            sx={{ mt: 0.2, fontSize: 10.75, color: "#9CA3AF" }}
                          >
                            {(item.captureType || "STANDARD").replaceAll("_", " ")}
                            {item.required ? " • Required" : ""}
                          </Typography>
                        </Box>

                        <Chip
                          size="small"
                          label={item.completed ? "Done" : "Pending"}
                          sx={{
                            borderRadius: 1,
                            bgcolor: item.completed ? "#EAFBF1" : "#F8F4F1",
                            color: item.completed ? "#22C55E" : "#8F8A84",
                            fontWeight: 700,
                            fontSize: 10.5,
                          }}
                        />
                      </Stack>
                    ))
                  ) : (
                    <EmptyStateBox label="No checklist items available" />
                  )}
                </Stack>
              </Card>

              <Card sx={{ ...cardSx, p: 2 }}>
                <Typography sx={sectionTitleSx}>Project Summary</Typography>
                <Stack spacing={1.35} sx={{ mt: 1.2 }}>
                  <SummaryRow label="Status" value={project.status || "-"} />
                  <SummaryRow label="Priority" value={project.priority || "-"} />
                  <SummaryRow label="Progress" value={`${project.progress || 0}%`} />
                  <SummaryRow
                    label="Attachments"
                    value={String(project.attachments?.length || 0)}
                  />
                  <SummaryRow
                    label="Assigned Staff"
                    value={String(project.assignedStaff?.length || 0)}
                  />
                </Stack>
              </Card>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}

function MetaCard({ icon, label, value }) {
  return (
    <Box
      sx={{
        p: 1.2,
        borderRadius: 1,
        border: "1px solid #F0EBE6",
        bgcolor: "#FBF8F6",
      }}
    >
      <Stack direction="row" spacing={0.75} alignItems="center">
        <Box sx={{ color: "#D88B72", display: "flex" }}>{icon}</Box>
        <Typography sx={{ fontSize: 11, color: "#A39D96", fontWeight: 700 }}>
          {label}
        </Typography>
      </Stack>
      <Typography sx={{ mt: 0.8, fontSize: 12.5, color: "#1F2937", fontWeight: 600 }}>
        {value}
      </Typography>
    </Box>
  );
}

function SummaryRow({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={1.5}>
      <Typography sx={{ fontSize: 12, color: "#A39D96", fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 12.5, color: "#1F2937", fontWeight: 600 }}>
        {value}
      </Typography>
    </Stack>
  );
}

function EmptyStateBox({ label }) {
  return (
    <Box
      sx={{
        minHeight: 110,
        border: "1px dashed #E5DED7",
        borderRadius: 1,
        bgcolor: "#FCFAF8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#B0B5BE",
        fontSize: 13,
      }}
    >
      {label}
    </Box>
  );
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const cardSx = {
  borderRadius: 1.2,
  border: "1px solid #E9E1DB",
  boxShadow: "none",
  bgcolor: "#FFFFFF",
};

const sectionTitleSx = {
  fontSize: 15,
  fontWeight: 700,
  color: "#1F2937",
};

const outlineButtonSx = {
  minWidth: 110,
  height: 36,
  borderRadius: 1,
  borderColor: "#E8E0DA",
  color: "#837E78",
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

const dangerButtonSx = {
  minWidth: 96,
  height: 36,
  borderRadius: 1,
  bgcolor: "#F04F5F",
  textTransform: "none",
  fontSize: 11.5,
  fontWeight: 600,
  boxShadow: "none",
  "&:hover": {
    bgcolor: "#DE4151",
    boxShadow: "none",
  },
};
