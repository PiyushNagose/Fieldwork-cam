import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  AddOutlined,
  FileDownloadOutlined,
  FilterListOutlined,
  SearchOutlined,
  VisibilityOutlined,
  EditOutlined,
  DeleteOutlineOutlined,
  KeyboardArrowLeftOutlined,
  KeyboardArrowRightOutlined,
} from "@mui/icons-material";
import { getProjectsApi } from "../../api/project.api";
import { getSubmissionByProjectApi } from "../../api/submission.api";

const STATUS_TABS = [
  { key: "ALL", label: "All" },
  { key: "New", label: "New" },
  { key: "In Progress", label: "In Progress" },
  { key: "Submitted", label: "Submitted" },
  { key: "Approved", label: "Approved" },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [submissionMap, setSubmissionMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const navigate = useNavigate();

  const fetchSubmissionMap = async (projectList) => {
    try {
      const results = await Promise.allSettled(
        projectList.map((project) =>
          getSubmissionByProjectApi(project._id || project.id),
        ),
      );

      const nextMap = {};

      results.forEach((result, index) => {
        const project = projectList[index];
        const projectId = project._id || project.id;

        if (result.status === "fulfilled") {
          const submission = result.value?.data || result.value || null;
          const submissionId = submission?._id || submission?.id;

          if (submissionId) {
            nextMap[projectId] = submissionId;
          }
        }
      });

      setSubmissionMap(nextMap);
    } catch {
      setSubmissionMap({});
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (activeTab !== "ALL") {
        params.status = activeTab;
      }

      const res = await getProjectsApi(params);
      const data = res?.data || res || [];
      const projectList = Array.isArray(data) ? data : [];

      setProjects(projectList);
      await fetchSubmissionMap(projectList);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load projects",
      );
      setProjects([]);
      setSubmissionMap({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [activeTab]);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return projects;

    return projects.filter((item) =>
      [
        item.projectCode,
        item.workOrderNumber,
        item.title,
        item.address,
        item.serviceType,
        item.vendorName,
        item.assignedVendorName,
        item.clientName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [projects, search]);

  const approvalRequestCount = useMemo(() => {
    return projects.filter((item) => {
      const projectId = item._id || item.id;
      const hasSubmission = Boolean(submissionMap[projectId]);
      return (
        hasSubmission && ["Submitted", "Retake Requested"].includes(item.status)
      );
    }).length;
  }, [projects, submissionMap]);

  const statusChip = (status = "") => {
    const map = {
      New: { bg: "#EEF4FF", color: "#4F83FF", dot: "#4F83FF", label: "New" },
      "In Progress": {
        bg: "#FFF5DD",
        color: "#E2A500",
        dot: "#E2A500",
        label: "In Progress",
      },
      Submitted: {
        bg: "#F3E8FF",
        color: "#9B5DE5",
        dot: "#9B5DE5",
        label: "Submitted",
      },
      Approved: {
        bg: "#EAFBF1",
        color: "#22C55E",
        dot: "#22C55E",
        label: "Approved",
      },
      Rejected: {
        bg: "#FDEBEC",
        color: "#F04F5F",
        dot: "#F04F5F",
        label: "Rejected",
      },
      Completed: {
        bg: "#EAFBF1",
        color: "#22C55E",
        dot: "#22C55E",
        label: "Completed",
      },
      "Retake Requested": {
        bg: "#FDEBEC",
        color: "#F04F5F",
        dot: "#F04F5F",
        label: "Retake Requested",
      },
    };

    const current = map[status] || {
      bg: "#F3F4F6",
      color: "#6B7280",
      dot: "#6B7280",
      label: status || "—",
    };

    return (
      <Chip
        label={
          <Stack direction="row" spacing={0.6} alignItems="center">
            <Box
              sx={{
                width: 5.5,
                height: 5.5,
                borderRadius: 999,
                bgcolor: current.dot,
              }}
            />
            <span>{current.label}</span>
          </Stack>
        }
        size="small"
        sx={{
          height: 23,
          bgcolor: current.bg,
          color: current.color,
          fontWeight: 600,
          fontSize: 10.5,
          borderRadius: 1,
          "& .MuiChip-label": { px: 1 },
        }}
      />
    );
  };

  const formatDate = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleOpenSubmissionReview = (project) => {
    const projectId = project._id || project.id;
    const submissionId = submissionMap[projectId];
    if (submissionId) {
      navigate(`/admin/submissions/${submissionId}`);
    }
  };

  const handleOpenFirstApprovalRequest = () => {
    const targetProject = projects.find((item) => {
      const projectId = item._id || item.id;
      const hasSubmission = Boolean(submissionMap[projectId]);
      return (
        hasSubmission && ["Submitted", "Retake Requested"].includes(item.status)
      );
    });
    if (targetProject) {
      handleOpenSubmissionReview(targetProject);
    }
  };

  return (
    <Box
      sx={{
        px: { xs: 1.5, md: 2 },
        py: { xs: 1.5, md: 2 },
        bgcolor: "#F8F5F2",
        minHeight: "100%",
      }}
    >
      {/* ── Page header ── */}
      <Typography
        sx={{
          fontSize: 28,
          fontWeight: 700,
          color: "#1F2937",
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
        }}
      >
        Projects
      </Typography>

      <Typography
        sx={{
          mt: 0.5,
          color: "#9CA3AF",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        Manage and track all field operation projects.
      </Typography>

      {/* ── Search + action buttons ── */}
      <Stack
        direction={{ xs: "column", lg: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", lg: "center" }}
        spacing={1.5}
        sx={{ mt: 2 }}
      >
        <OutlinedInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ID, address, vendor, or service..."
          startAdornment={
            <InputAdornment position="start">
              <SearchOutlined sx={{ fontSize: 17, color: "#B4ADA6" }} />
            </InputAdornment>
          }
          sx={{
            flex: 1,
            maxWidth: { xs: "100%", lg: 540 },
            height: 40,
            bgcolor: "#F5EFEB",
            borderRadius: 1,
            fontSize: 13,
            color: "#4B5563",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E8E0DA" },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#DFD6CF",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#D7C9BD",
              borderWidth: "1px",
            },
          }}
        />

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlined sx={{ fontSize: 16 }} />}
            sx={{
              minWidth: 84,
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
            }}
          >
            Export
          </Button>

          <Button
            variant="contained"
            startIcon={<AddOutlined sx={{ fontSize: 16 }} />}
            onClick={() => navigate("/admin/projects/new")}
            sx={{
              minWidth: 112,
              height: 36,
              borderRadius: 1,
              bgcolor: "#8D7B72",
              textTransform: "none",
              fontSize: 11.5,
              fontWeight: 600,
              boxShadow: "none",
              "&:hover": { bgcolor: "#7D6B63", boxShadow: "none" },
            }}
          >
            New Project
          </Button>
        </Stack>
      </Stack>

      {/* ── Status tabs + filter buttons ── */}
      <Stack
        direction={{ xs: "column", xl: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", xl: "center" }}
        spacing={1.25}
        sx={{ mt: 1.4 }}
      >
        <Stack direction="row" spacing={0.9} flexWrap="wrap" useFlexGap>
          {STATUS_TABS.map((tab) => {
            const count =
              tab.key === "ALL"
                ? projects.length
                : projects.filter((item) => item.status === tab.key).length;
            const active = activeTab === tab.key;

            return (
              <Button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
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
                {tab.label}
                <Box
                  component="span"
                  sx={{
                    ml: 0.7,
                    fontSize: 10,
                    color: active ? "#7A6D64" : "#AAA39C",
                    fontWeight: 700,
                  }}
                >
                  {count}
                </Box>
              </Button>
            );
          })}
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<FilterListOutlined sx={{ fontSize: 16 }} />}
            sx={{
              height: 30,
              borderRadius: 1,
              borderColor: "#E8E0DA",
              color: "#837E78",
              bgcolor: "#FFFFFF",
              textTransform: "none",
              fontSize: 11.5,
              fontWeight: 500,
              minWidth: 96,
              boxShadow: "none",
              "&:hover": {
                borderColor: "#DED3CB",
                bgcolor: "#FCFAF8",
                boxShadow: "none",
              },
            }}
          >
            More Filters
          </Button>

          <Button
            variant="contained"
            onClick={handleOpenFirstApprovalRequest}
            disabled={!approvalRequestCount}
            sx={{
              height: 30,
              borderRadius: 1,
              bgcolor: "#8D7B72",
              textTransform: "none",
              fontSize: 11.5,
              fontWeight: 500,
              minWidth: 140,
              boxShadow: "none",
              "&:hover": { bgcolor: "#7D6B63", boxShadow: "none" },
              "&.Mui-disabled": { bgcolor: "#D7CDC6", color: "#8F8A84" },
            }}
          >
            Approval Requests ({approvalRequestCount})
          </Button>
        </Stack>
      </Stack>

      {/* ── Table card ── */}
      <Card
        sx={{
          mt: 1.5,
          borderRadius: 1,
          border: "1px solid #E9E1DB",
          boxShadow: "none",
          overflow: "hidden",
          bgcolor: "#FFFFFF",
        }}
      >
        {loading ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ minHeight: 320 }}
            spacing={2}
          >
            <CircularProgress />
            <Typography color="text.secondary">Loading projects...</Typography>
          </Stack>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="error" sx={{ borderRadius: 1 }}>
              {error}
            </Alert>
            <Button sx={{ mt: 2 }} variant="contained" onClick={fetchProjects}>
              Retry
            </Button>
          </Box>
        ) : filteredProjects.length === 0 ? (
          <Box
            sx={{
              m: 2,
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
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      "& th": {
                        borderBottom: "1px solid #EEE7E2",
                        py: 1.45,
                        px: 1.75,
                      },
                    }}
                  >
                    <TableCell sx={tableHeadCellSx}>PROJECT ID ↕</TableCell>
                    <TableCell sx={tableHeadCellSx}>
                      PROPERTY ADDRESS ↕
                    </TableCell>
                    <TableCell sx={tableHeadCellSx}>SERVICE TYPE ↕</TableCell>
                    <TableCell sx={tableHeadCellSx}>VENDOR ↕</TableCell>
                    <TableCell sx={tableHeadCellSx}>DUE DATE ↕</TableCell>
                    <TableCell sx={tableHeadCellSx}>STATUS ↕</TableCell>
                    <TableCell sx={{ ...tableHeadCellSx, textAlign: "center" }}>
                      ACTIONS
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredProjects.map((item, index) => {
                    const projectId = item._id || item.id;
                    const submissionId = submissionMap[projectId];
                    const canReview =
                      Boolean(submissionId) &&
                      ["Submitted", "Retake Requested"].includes(item.status);

                    return (
                      <TableRow
                        key={projectId || index}
                        hover
                        sx={{
                          "& td": {
                            borderBottom: "1px solid #F3EEEA",
                            py: 1.25,
                            px: 1.75,
                          },
                          "&:last-child td": { borderBottom: "none" },
                          "&:hover": { bgcolor: "#FCFAF8" },
                        }}
                      >
                        <TableCell
                          sx={{
                            ...tableBodyCellSx,
                            color: "#45403B",
                            fontWeight: 500,
                            width: 110,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.projectCode || item.workOrderNumber || "—"}
                        </TableCell>

                        <TableCell
                          sx={{
                            ...tableBodyCellSx,
                            color: "#5A5550",
                            maxWidth: 220,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 12.5,
                              color: "#5A5550",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {item.address || "—"}
                          </Typography>
                        </TableCell>

                        <TableCell
                          sx={{
                            ...tableBodyCellSx,
                            color: "#9B948D",
                            maxWidth: 160,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 12,
                              color: "#9B948D",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {item.serviceType || item.title || "—"}
                          </Typography>
                        </TableCell>

                        <TableCell
                          sx={{
                            ...tableBodyCellSx,
                            color: "#4A4641",
                            fontWeight: 500,
                            maxWidth: 140,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 12.5,
                              color: "#4A4641",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {item.vendorName ||
                              item.assignedVendorName ||
                              item.assignedVendorAuthUserId ||
                              "—"}
                          </Typography>
                        </TableCell>

                        <TableCell
                          sx={{
                            ...tableBodyCellSx,
                            color: "#8E8882",
                            width: 90,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatDate(item.dueDate)}
                        </TableCell>

                        <TableCell sx={{ ...tableBodyCellSx, width: 120 }}>
                          {statusChip(item.status)}
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{ ...tableBodyCellSx, width: 220 }}
                        >
                          <Stack
                            direction="row"
                            spacing={0.5}
                            justifyContent="center"
                            alignItems="center"
                          >
                            {canReview ? (
                              <Button
                                variant="contained"
                                onClick={() => handleOpenSubmissionReview(item)}
                                sx={{
                                  minWidth: 128,
                                  height: 28,
                                  borderRadius: 1,
                                  bgcolor: "#8D7B72",
                                  textTransform: "none",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  px: 1.2,
                                  boxShadow: "none",
                                  "&:hover": {
                                    bgcolor: "#7D6B63",
                                    boxShadow: "none",
                                  },
                                }}
                              >
                                Approval Request
                              </Button>
                            ) : (
                              <Typography
                                sx={{
                                  fontSize: 11,
                                  color: "#B0B5BE",
                                  minWidth: 128,
                                  textAlign: "center",
                                }}
                              >
                                No submission
                              </Typography>
                            )}

                            <IconButton
                              size="small"
                              onClick={() =>
                                navigate(`/admin/projects/${projectId}`)
                              }
                              sx={{ color: "#A9A39C", width: 24, height: 24 }}
                            >
                              <VisibilityOutlined sx={{ fontSize: 14 }} />
                            </IconButton>

                            <IconButton
                              size="small"
                              sx={{ color: "#A9A39C", width: 24, height: 24 }}
                            >
                              <EditOutlined sx={{ fontSize: 14 }} />
                            </IconButton>

                            <IconButton
                              size="small"
                              sx={{ color: "#A9A39C", width: 24, height: 24 }}
                            >
                              <DeleteOutlineOutlined sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{
                px: 1.75,
                py: 1.2,
                borderTop: "1px solid #F3EEEA",
                bgcolor: "#FFFFFF",
              }}
            >
              <Typography
                sx={{ fontSize: 11, color: "#A39D96", fontWeight: 500 }}
              >
                Showing 1–{filteredProjects.length} of {projects.length}{" "}
                projects
              </Typography>

              <Stack direction="row" spacing={0.35} alignItems="center">
                <IconButton
                  size="small"
                  sx={{ width: 22, height: 22, color: "#C2BAB2" }}
                >
                  <KeyboardArrowLeftOutlined sx={{ fontSize: 16 }} />
                </IconButton>

                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: 1,
                    bgcolor: "#F1DED4",
                    color: "#7D6A61",
                    fontSize: 10.5,
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  1
                </Box>

                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: 1,
                    color: "#8F8881",
                    fontSize: 10.5,
                    fontWeight: 600,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  2
                </Box>

                <IconButton
                  size="small"
                  sx={{ width: 22, height: 22, color: "#9E968F" }}
                >
                  <KeyboardArrowRightOutlined sx={{ fontSize: 16 }} />
                </IconButton>
              </Stack>
            </Stack>
          </>
        )}
      </Card>
    </Box>
  );
}

const tableHeadCellSx = {
  fontSize: 10.5,
  fontWeight: 700,
  color: "#AEA7A0",
  letterSpacing: "0.04em",
  whiteSpace: "nowrap",
};

const tableBodyCellSx = {
  fontSize: 12.5,
  color: "#5A5550",
  verticalAlign: "middle",
};
