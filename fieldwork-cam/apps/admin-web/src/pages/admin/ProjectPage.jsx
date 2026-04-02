import React, { useEffect, useMemo, useState, useCallback } from "react";
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
  DeleteOutlineOutlined,
  EditOutlined,
  FileDownloadOutlined,
  FilterListOutlined,
  KeyboardArrowLeftOutlined,
  KeyboardArrowRightOutlined,
  SearchOutlined,
  VisibilityOutlined,
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

const getRowStatusTone = (status = "") => {
  const tones = {
    New: { bg: "#EEF4FF", color: "#4F83FF", dot: "#4F83FF" },
    "In Progress": { bg: "#FFF5DD", color: "#E2A500", dot: "#E2A500" },
    Submitted: { bg: "#F3E8FF", color: "#9B5DE5", dot: "#9B5DE5" },
    Approved: { bg: "#EAFBF1", color: "#22C55E", dot: "#22C55E" },
    Rejected: { bg: "#FDEBEC", color: "#F04F5F", dot: "#F04F5F" },
    "Retake Requested": { bg: "#FDEBEC", color: "#F04F5F", dot: "#F04F5F" },
    Completed: { bg: "#EAFBF1", color: "#22C55E", dot: "#22C55E" },
  };

  return (
    tones[status] || {
      bg: "#F4F4F5",
      color: "#7C7A77",
      dot: "#7C7A77",
    }
  );
};

const formatShortDate = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const csvEscape = (value) => {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

export default function ProjectPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [submissionMap, setSubmissionMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");

  const fetchSubmissionMap = async (projectList) => {
    try {
      const results = await Promise.allSettled(
        projectList.map((project) =>
          getSubmissionByProjectApi(project._id || project.id),
        ),
      );

      const nextMap = {};

      results.forEach((result, index) => {
        if (result.status !== "fulfilled") return;

        const project = projectList[index];
        const projectId = project._id || project.id;
        const submission = result.value?.data || result.value || null;
        const submissionId = submission?._id || submission?.id;

        if (projectId && submissionId) {
          nextMap[projectId] = submissionId;
        }
      });

      setSubmissionMap(nextMap);
    } catch {
      setSubmissionMap({});
    }
  };

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (activeTab !== "ALL") {
        params.status = activeTab;
      }

      const response = await getProjectsApi(params);
      const data = response?.data || response || [];
      const nextProjects = Array.isArray(data) ? data : [];

      setProjects(nextProjects);
      await fetchSubmissionMap(nextProjects);
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
  }, [activeTab]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return projects;

    return projects.filter((project) =>
      [
        project.projectCode,
        project.workOrderNumber,
        project.title,
        project.address,
        project.serviceType,
        project.clientName,
        project.vendorName,
        project.assignedVendorName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [projects, search]);

  const approvalRequestCount = useMemo(
    () =>
      filteredProjects.filter((project) => {
        const projectId = project._id || project.id;
        return (
          Boolean(submissionMap[projectId]) &&
          ["Submitted", "Retake Requested"].includes(project.status)
        );
      }).length,
    [filteredProjects, submissionMap],
  );

  const handleOpenSubmission = (project) => {
    const projectId = project._id || project.id;
    const submissionId = submissionMap[projectId];

    if (submissionId) {
      navigate(`/admin/submissions/${submissionId}`);
    }
  };

  const handleOpenFirstApproval = () => {
    const firstProject = filteredProjects.find((project) => {
      const projectId = project._id || project.id;
      return (
        Boolean(submissionMap[projectId]) &&
        ["Submitted", "Retake Requested"].includes(project.status)
      );
    });

    if (firstProject) {
      handleOpenSubmission(firstProject);
    }
  };

  const handleExport = () => {
    const rows = filteredProjects.map((project) => ({
      projectId: project.projectCode || project.workOrderNumber || "",
      projectName: project.title || "",
      address: project.address || "",
      serviceType: project.serviceType || "",
      vendor:
        project.vendorName ||
        project.assignedVendorName ||
        project.assignedVendorAuthUserId ||
        "",
      dueDate: project.dueDate || "",
      status: project.status || "",
      priority: project.priority || "",
      clientName: project.clientName || "",
    }));

    const header = [
      "Project ID",
      "Project Name",
      "Address",
      "Service Type",
      "Vendor",
      "Due Date",
      "Status",
      "Priority",
      "Client",
    ];

    const csv = [
      header.join(","),
      ...rows.map((row) =>
        [
          row.projectId,
          row.projectName,
          row.address,
          row.serviceType,
          row.vendor,
          row.dueDate,
          row.status,
          row.priority,
          row.clientName,
        ]
          .map(csvEscape)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "projects-export.csv";
    link.click();
    URL.revokeObjectURL(url);
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
      <Box sx={{ maxWidth: 1240 }}>
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
            mt: 0.4,
            color: "#9CA3AF",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Manage and track all field operation projects.
        </Typography>

        <Card
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 1.2,
            border: "1px solid #E9E1DB",
            boxShadow: "none",
            bgcolor: "#FFFFFF",
          }}
        >
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={1.25}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", lg: "center" }}
        >
          <OutlinedInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by ID, address, vendor, or service..."
            startAdornment={
              <InputAdornment position="start">
                <SearchOutlined sx={{ fontSize: 17, color: "#B4ADA6" }} />
              </InputAdornment>
            }
            sx={{
              flex: 1,
              height: 38,
              bgcolor: "#FBF8F6",
              borderRadius: 1,
              fontSize: 12.5,
              color: "#4B5563",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#EEE6E0",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#E3D8D0",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#DCCDC2",
                borderWidth: "1px",
              },
            }}
          />

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<FileDownloadOutlined sx={{ fontSize: 15 }} />}
              onClick={handleExport}
              sx={outlineButtonSx}
            >
              Export
            </Button>

            <Button
              variant="contained"
              startIcon={<AddOutlined sx={{ fontSize: 15 }} />}
              onClick={() => navigate("/admin/projects/new")}
              sx={primaryButtonSx}
            >
              New Project
            </Button>
          </Stack>
        </Stack>

        <Stack
          direction={{ xs: "column", xl: "row" }}
          spacing={1.25}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", xl: "center" }}
          sx={{ mt: 1.35 }}
        >
          <Stack direction="row" spacing={0.85} flexWrap="wrap" useFlexGap>
            {STATUS_TABS.map((tab) => {
              const count =
                tab.key === "ALL"
                  ? projects.length
                  : projects.filter((project) => project.status === tab.key).length;

              const active = activeTab === tab.key;

              return (
                <Button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  sx={{
                    px: 1.5,
                    minHeight: 28,
                    minWidth: "auto",
                    borderRadius: 1,
                    border: "1px solid #EEE5DF",
                    bgcolor: active ? "#F1DED4" : "#F8F4F1",
                    color: active ? "#4F433B" : "#8F8A84",
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: "none",
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: active ? "#EAD7CC" : "#F3EEEA",
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
                      fontWeight: 700,
                      color: active ? "#7A6D64" : "#AAA39C",
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
              startIcon={<FilterListOutlined sx={{ fontSize: 15 }} />}
              onClick={() => {
                setSearch("");
                setActiveTab("ALL");
              }}
              sx={{ ...outlineButtonSx, minWidth: 112 }}
            >
              More Filters
            </Button>

            <Button
              variant="contained"
              onClick={handleOpenFirstApproval}
              disabled={!approvalRequestCount}
              sx={{
                ...primaryButtonSx,
                minWidth: 154,
                bgcolor: "#A59488",
                "&:hover": { bgcolor: "#948378", boxShadow: "none" },
                "&.Mui-disabled": { bgcolor: "#D9CEC6", color: "#8F8A84" },
              }}
            >
              Approval Requests {approvalRequestCount ? `${approvalRequestCount}` : ""}
            </Button>
          </Stack>
        </Stack>
        </Card>

        <Card
          sx={{
            mt: 1.25,
            borderRadius: 1.2,
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
            spacing={2}
            sx={{ minHeight: 320 }}
          >
            <CircularProgress />
            <Typography sx={{ fontSize: 13, color: "#8E8882" }}>
              Loading projects...
            </Typography>
          </Stack>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="error" sx={{ borderRadius: 1 }}>
              {error}
            </Alert>
            <Button variant="contained" onClick={fetchProjects} sx={{ mt: 1.5 }}>
              Retry
            </Button>
          </Box>
        ) : filteredProjects.length === 0 ? (
          <Box
            sx={{
              m: 2,
              minHeight: 180,
              borderRadius: 1,
              border: "1px dashed #E6DED7",
              bgcolor: "#FCFAF8",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Typography sx={{ fontSize: 13, color: "#A39D96", fontWeight: 500 }}>
              No projects found
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      "& th": {
                        borderBottom: "1px solid #EFE8E3",
                        py: 1.4,
                        px: 1.75,
                      },
                    }}
                  >
                    <TableCell sx={tableHeadCellSx}>PROJECT ID</TableCell>
                    <TableCell sx={tableHeadCellSx}>PROPERTY ADDRESS</TableCell>
                    <TableCell sx={tableHeadCellSx}>SERVICE TYPE</TableCell>
                    <TableCell sx={tableHeadCellSx}>VENDOR</TableCell>
                    <TableCell sx={tableHeadCellSx}>DUE DATE</TableCell>
                    <TableCell sx={tableHeadCellSx}>STATUS</TableCell>
                    <TableCell sx={{ ...tableHeadCellSx, textAlign: "center" }}>
                      ACTIONS
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredProjects.map((project) => {
                    const projectId = project._id || project.id;
                    const hasSubmission = Boolean(submissionMap[projectId]);
                    const tone = getRowStatusTone(project.status);

                    return (
                      <TableRow
                        key={projectId}
                        hover
                        sx={{
                          "& td": {
                            borderBottom: "1px solid #F4EEEA",
                            py: 1.2,
                            px: 1.75,
                          },
                          "&:last-child td": { borderBottom: "none" },
                          "&:hover": { bgcolor: "#FCFAF8" },
                        }}
                      >
                        <TableCell sx={{ ...tableBodyCellSx, fontWeight: 600, color: "#4B5563" }}>
                          {project.projectCode || project.workOrderNumber || "-"}
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <Typography sx={ellipsisCellTextSx}>
                            {project.address || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <Typography sx={{ ...ellipsisCellTextSx, color: "#8C8781" }}>
                            {project.serviceType || project.title || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <Typography sx={ellipsisCellTextSx}>
                            {project.vendorName ||
                              project.assignedVendorName ||
                              project.assignedVendorAuthUserId ||
                              "-"}
                          </Typography>
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          {formatShortDate(project.dueDate)}
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <Chip
                            size="small"
                            label={
                              <Stack direction="row" spacing={0.6} alignItems="center">
                                <Box
                                  sx={{
                                    width: 5.5,
                                    height: 5.5,
                                    borderRadius: 999,
                                    bgcolor: tone.dot,
                                  }}
                                />
                                <span>{project.status || "Unknown"}</span>
                              </Stack>
                            }
                            sx={{
                              height: 23,
                              borderRadius: 1,
                              bgcolor: tone.bg,
                              color: tone.color,
                              fontWeight: 600,
                              fontSize: 10.5,
                              "& .MuiChip-label": { px: 1 },
                            }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={tableBodyCellSx}>
                          <Stack
                            direction="row"
                            spacing={0.4}
                            alignItems="center"
                            justifyContent="center"
                          >
                            <IconButton
                              size="small"
                              disabled={!hasSubmission}
                              onClick={() => handleOpenSubmission(project)}
                              sx={actionIconButtonSx}
                            >
                              <VisibilityOutlined sx={{ fontSize: 14 }} />
                            </IconButton>
                            <IconButton size="small" disabled sx={actionIconButtonSx}>
                              <EditOutlined sx={{ fontSize: 14 }} />
                            </IconButton>
                            <IconButton size="small" disabled sx={actionIconButtonSx}>
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
                py: 1.15,
                borderTop: "1px solid #F3EEEA",
              }}
            >
              <Typography sx={{ fontSize: 11, color: "#A39D96", fontWeight: 500 }}>
                Showing 1-{filteredProjects.length} of {projects.length} projects
              </Typography>

              <Stack direction="row" spacing={0.35} alignItems="center">
                <IconButton size="small" sx={paginationIconSx}>
                  <KeyboardArrowLeftOutlined sx={{ fontSize: 15 }} />
                </IconButton>
                <Box sx={pageNumberActiveSx}>1</Box>
                <Box sx={pageNumberSx}>2</Box>
                <IconButton size="small" sx={paginationIconSx}>
                  <KeyboardArrowRightOutlined sx={{ fontSize: 15 }} />
                </IconButton>
              </Stack>
            </Stack>
          </>
        )}
        </Card>
      </Box>
    </Box>
  );
}

const primaryButtonSx = {
  minWidth: 118,
  height: 36,
  borderRadius: 1,
  bgcolor: "#8D7B72",
  textTransform: "none",
  fontSize: 11.5,
  fontWeight: 600,
  boxShadow: "none",
  "&:hover": { bgcolor: "#7D6B63", boxShadow: "none" },
};

const outlineButtonSx = {
  minWidth: 88,
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

const ellipsisCellTextSx = {
  fontSize: 12.5,
  color: "#5A5550",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: 220,
};

const actionIconButtonSx = {
  width: 24,
  height: 24,
  color: "#A9A39C",
  "&.Mui-disabled": {
    color: "#D0CAC5",
  },
};

const paginationIconSx = {
  width: 22,
  height: 22,
  color: "#C2BAB2",
};

const pageNumberActiveSx = {
  width: 22,
  height: 22,
  borderRadius: 1,
  bgcolor: "#F1DED4",
  color: "#7D6A61",
  fontSize: 10.5,
  fontWeight: 700,
  display: "grid",
  placeItems: "center",
};

const pageNumberSx = {
  width: 22,
  height: 22,
  color: "#8F8881",
  fontSize: 10.5,
  fontWeight: 600,
  display: "grid",
  placeItems: "center",
};
