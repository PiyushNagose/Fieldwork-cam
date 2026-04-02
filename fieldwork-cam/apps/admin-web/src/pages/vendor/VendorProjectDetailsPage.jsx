import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import {
  CalendarTodayOutlined,
  CheckCircleOutlineOutlined,
  ChevronRightOutlined,
  LocationOnOutlined,
  PersonOutlineOutlined,
  ReceiptLongOutlined,
} from "@mui/icons-material";
import { useParams } from "react-router-dom";
import { getProjectByIdApi } from "../../api/project.api";
import { getStaffApi } from "../../api/staff.api";

const DEFAULT_CHECKLIST = [
  "Front Exterior - Street View",
  "Driveway - Full Angle",
  "Entryway - Main View",
  "Backyard - Rear View",
  "Living Area - Full View",
  "Bedroom 1 - Primary",
  "Bedroom 2 - Second",
  "Laundry Room",
  "Roof - Aerial Overview",
  "HVAC Exterior Detail",
];

export default function VendorProjectDetailsPage() {
  const { projectId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [project, setProject] = useState(null);
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const [projectRes, staffRes] = await Promise.all([
          getProjectByIdApi(projectId),
          getStaffApi(),
        ]);

        setProject(projectRes?.data || projectRes || null);
        setStaff(staffRes?.data || staffRes || []);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            "Failed to load project details",
        );
        setProject(null);
        setStaff([]);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  const assignedStaff = useMemo(() => {
    const assignments = Array.isArray(project?.assignedStaff) ? project.assignedStaff : [];

    return assignments
      .map((entry) => staff.find((item) => item.authUserId === entry.staffId))
      .filter(Boolean);
  }, [project, staff]);

  const checklist = useMemo(() => {
    const completedItems = Math.max(
      0,
      Math.min(
        DEFAULT_CHECKLIST.length,
        Math.round((Number(project?.progress || 0) / 100) * DEFAULT_CHECKLIST.length),
      ),
    );

    return DEFAULT_CHECKLIST.map((label, index) => ({
      label,
      status: index < completedItems ? "uploaded" : "pending",
    }));
  }, [project?.progress]);

  const notes = useMemo(() => {
    const items = Array.isArray(project?.notes) ? [...project.notes] : [];
    return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [project?.notes]);

  const timeline = useMemo(() => {
    if (!project) return [];

    const items = [
      {
        title: "Project Assigned",
        subtitle: project.assignedVendorAuthUserId
          ? "Project assigned to vendor"
          : "Created in the system",
        date: project.createdAt,
      },
    ];

    if (Number(project.progress || 0) > 0) {
      items.push({
        title: "Progress Updated",
        subtitle: `${project.progress}% checklist complete`,
        date: project.updatedAt || project.createdAt,
      });
    }

    if (project.status === "Submitted") {
      items.push({
        title: "Photos Uploaded",
        subtitle: "Submission is ready for review",
        date: project.updatedAt || project.createdAt,
      });
    }

    if (["Completed", "Approved"].includes(project.status)) {
      items.push({
        title: "Client Approved",
        subtitle: "Assignment completed successfully",
        date: project.updatedAt || project.createdAt,
      });
    }

    return items;
  }, [project]);

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 320 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ borderRadius: 1 }}>{error}</Alert>;
  }

  if (!project) {
    return (
      <Box
        sx={{
          minHeight: 200,
          border: "1px dashed #E5DED7",
          borderRadius: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#B0B5BE",
          fontSize: 13,
          bgcolor: "#FCFAF8",
        }}
      >
        No project found
      </Box>
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
          borderRadius: 1,
          border: "1px solid #E9E1DB",
          boxShadow: "none",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            height: 240,
            backgroundImage: project.coverImageUrl
              ? `url(${project.coverImageUrl})`
              : detailGradient(project),
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderBottom: "1px solid #E9E1DB",
          }}
        />

        <Box sx={{ px: 1.8, py: 1.5 }}>
          <Typography
            sx={{
              fontSize: 17,
              fontWeight: 700,
              color: "#1F2937",
              lineHeight: 1.2,
            }}
          >
            {project.address || project.title || "Untitled Project"}
          </Typography>

          <Box
            sx={{
              mt: 1.2,
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
              gap: 1.1,
            }}
          >
            <MetaBlock
              icon={<LocationOnOutlined sx={{ fontSize: 14 }} />}
              label="Location"
              value={shortLocation(project.address)}
            />
            <MetaBlock
              icon={<PersonOutlineOutlined sx={{ fontSize: 14 }} />}
              label="Client"
              value={project.clientName || "FieldWork Client"}
            />
            <MetaBlock
              icon={<ReceiptLongOutlined sx={{ fontSize: 14 }} />}
              label="Project ID"
              value={project.workOrderNumber || "N/A"}
            />
            <MetaBlock
              icon={<CalendarTodayOutlined sx={{ fontSize: 14 }} />}
              label="Due"
              value={formatDate(project.dueDate)}
            />
          </Box>
        </Box>
      </Card>

      <SectionCard
        title="Location"
        icon={<LocationOnOutlined sx={{ fontSize: 16, color: "#6366F1" }} />}
      >
        <Box
          sx={{
            mt: 1.25,
            minHeight: 150,
            borderRadius: 1,
            bgcolor: "#F4F6F8",
            border: "1px solid #E9E1DB",
            p: 1.2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Box />
          <Button
            variant="outlined"
            sx={{
              alignSelf: "flex-start",
              minHeight: 24,
              px: 0.9,
              borderRadius: 999,
              borderColor: "#E3E8EF",
              bgcolor: "#FFFFFF",
              color: "#6B7280",
              fontSize: 10.5,
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            {project.address || "No address available"}
          </Button>
        </Box>
      </SectionCard>

      <SectionCard
        title="Photo Checklist"
        icon={<CheckCircleOutlineOutlined sx={{ fontSize: 16, color: "#6366F1" }} />}
        rightText={`${checklist.filter((item) => item.status === "uploaded").length} uploaded • ${checklist.length} required`}
      >
        <Stack spacing={1} sx={{ mt: 1.2 }}>
          {checklist.map((item) => (
            <ChecklistRow key={item.label} item={item} />
          ))}
        </Stack>
      </SectionCard>

      <SectionCard title="Quick Stats">
        <Box
          sx={{
            mt: 1.25,
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
            gap: 1,
          }}
        >
          <QuickStatCard
            label="Photos"
            value={`${checklist.filter((item) => item.status === "uploaded").length}/${checklist.length}`}
            bg="#EEF2FF"
            color="#4F46E5"
          />
          <QuickStatCard
            label="Progress"
            value={`${project.progress || 0}%`}
            bg="#FFF8E6"
            color="#D97706"
          />
          <QuickStatCard
            label="Assigned"
            value={assignedStaff.length}
            bg="#ECFDF5"
            color="#10B981"
          />
          <QuickStatCard
            label="Priority"
            value={project.priority || "Medium"}
            bg="#FEF2F2"
            color="#EF4444"
          />
        </Box>
      </SectionCard>

      <SectionCard title="Assigned Staff">
        <Stack spacing={1} sx={{ mt: 1.2 }}>
          {assignedStaff.length ? (
            assignedStaff.map((item) => (
              <Stack
                key={item.authUserId}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  px: 1.1,
                  py: 1,
                  borderRadius: 1,
                  border: "1px solid #EEE7E2",
                  bgcolor: "#FFFFFF",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar
                    src={item.profilePhotoUrl || ""}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 1,
                      bgcolor: "#E9CFC2",
                      color: "#7C6258",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {item.fullName?.charAt(0) || "S"}
                  </Avatar>
                  <Box>
                    <Typography
                      sx={{ fontSize: 12.5, fontWeight: 700, color: "#1F2937" }}
                    >
                      {item.fullName}
                    </Typography>
                    <Typography
                      sx={{ fontSize: 11.5, color: "#9CA3AF", fontWeight: 500 }}
                    >
                      {item.roleTitle || "Field Photographer"}
                    </Typography>
                  </Box>
                </Stack>
                <ChevronRightOutlined sx={{ fontSize: 16, color: "#C2BAB2" }} />
              </Stack>
            ))
          ) : (
            <EmptyMini label="No staff assigned yet" />
          )}
        </Stack>
      </SectionCard>

      <SectionCard title="Timeline">
        <Stack spacing={1.3} sx={{ mt: 1.2 }}>
          {timeline.length ? (
            timeline.map((item, index) => (
              <Stack key={`${item.title}-${index}`} direction="row" spacing={1.1}>
                <Stack alignItems="center" sx={{ pt: 0.2 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: index === 0 ? "#10B981" : "#F59E0B",
                    }}
                  />
                  {index !== timeline.length - 1 ? (
                    <Box sx={{ width: 1.5, height: 28, bgcolor: "#E5DED7", mt: 0.35 }} />
                  ) : null}
                </Stack>

                <Box>
                  <Typography
                    sx={{ fontSize: 12.5, fontWeight: 700, color: "#1F2937" }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    sx={{ mt: 0.2, fontSize: 11.5, color: "#9CA3AF", fontWeight: 500 }}
                  >
                    {item.subtitle}
                  </Typography>
                  <Typography
                    sx={{ mt: 0.25, fontSize: 11, color: "#B0B5BE", fontWeight: 500 }}
                  >
                    {formatDate(item.date)}
                  </Typography>
                </Box>
              </Stack>
            ))
          ) : (
            <EmptyMini label="No timeline activity yet" />
          )}
        </Stack>
      </SectionCard>

      <SectionCard title="Recent Notes" rightText={notes.length ? "View all" : null}>
        <Stack spacing={1} sx={{ mt: 1.2 }}>
          {notes.length ? (
            notes.map((item, index) => (
              <Box
                key={`${item.createdAt || index}-${index}`}
                sx={{
                  px: 1.1,
                  py: 1,
                  borderRadius: 1,
                  border: "1px solid #EEE7E2",
                  bgcolor: "#FFFFFF",
                }}
              >
                <Typography
                  sx={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}
                >
                  {item.note}
                </Typography>
                <Typography
                  sx={{ mt: 0.45, fontSize: 11, color: "#B0B5BE", fontWeight: 500 }}
                >
                  {item.createdByAuthUserId || "System"} • {formatDate(item.createdAt)}
                </Typography>
              </Box>
            ))
          ) : (
            <EmptyMini label="No recent notes available" />
          )}
        </Stack>
      </SectionCard>
    </Box>
  );
}

function SectionCard({ title, icon, rightText, children }) {
  return (
    <Card
      sx={{
        mt: 1.5,
        p: 1.5,
        borderRadius: 1,
        border: "1px solid #E9E1DB",
        boxShadow: "none",
        bgcolor: "#FFFFFF",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" spacing={0.8} alignItems="center">
          {icon || (
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                border: "2px solid #6366F1",
              }}
            />
          )}
          <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#1F2937" }}>
            {title}
          </Typography>
        </Stack>

        {rightText ? (
          <Typography sx={{ fontSize: 11.5, color: "#6366F1", fontWeight: 600 }}>
            {rightText}
          </Typography>
        ) : null}
      </Stack>
      {children}
    </Card>
  );
}

function MetaBlock({ icon, label, value }) {
  return (
    <Stack direction="row" spacing={0.8} alignItems="flex-start">
      <Box sx={{ color: "#9CA3AF", mt: 0.15 }}>{icon}</Box>
      <Box>
        <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>
          {label}
        </Typography>
        <Typography sx={{ mt: 0.2, fontSize: 12.5, color: "#1F2937", fontWeight: 600 }}>
          {value || "N/A"}
        </Typography>
      </Box>
    </Stack>
  );
}

function ChecklistRow({ item }) {
  const uploaded = item.status === "uploaded";

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{
        px: 1,
        py: 0.9,
        borderRadius: 1,
        bgcolor: uploaded ? "#FFFFFF" : "#FCFAF8",
        border: "1px solid #EEE7E2",
      }}
    >
      <Stack direction="row" spacing={0.8} alignItems="center">
        <Box
          sx={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            border: `1.5px solid ${uploaded ? "#22C55E" : "#D1D5DB"}`,
            display: "grid",
            placeItems: "center",
          }}
        >
          {uploaded ? (
            <CheckCircleOutlineOutlined sx={{ fontSize: 12, color: "#22C55E" }} />
          ) : null}
        </Box>
        <Typography sx={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>
          {item.label}
        </Typography>
      </Stack>

      <Typography
        sx={{
          fontSize: 11.5,
          color: uploaded ? "#22C55E" : "#B0B5BE",
          fontWeight: 600,
        }}
      >
        {uploaded ? "Uploaded" : "Pending"}
      </Typography>
    </Stack>
  );
}

function QuickStatCard({ label, value, bg, color }) {
  return (
    <Box
      sx={{
        borderRadius: 1,
        bgcolor: bg,
        px: 1,
        py: 1.05,
      }}
    >
      <Typography
        sx={{
          fontSize: 15,
          fontWeight: 700,
          color,
          textAlign: "center",
        }}
      >
        {value}
      </Typography>
      <Typography
        sx={{
          mt: 0.3,
          fontSize: 10.5,
          fontWeight: 700,
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

function EmptyMini({ label }) {
  return (
    <Box
      sx={{
        minHeight: 90,
        borderRadius: 1,
        border: "1px dashed #E5DED7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#B0B5BE",
        fontSize: 12.5,
        bgcolor: "#FCFAF8",
      }}
    >
      {label}
    </Box>
  );
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

function detailGradient(project) {
  const key = String(project?.serviceType || project?.title || "").toLowerCase();
  if (key.includes("survey")) {
    return "linear-gradient(135deg, #2f4858 0%, #5c7e92 40%, #9ad1f7 100%)";
  }
  if (key.includes("solar")) {
    return "linear-gradient(135deg, #607744 0%, #97b668 45%, #dce8a0 100%)";
  }
  return "linear-gradient(135deg, #395c7a 0%, #7ca4c9 42%, #d2e7f7 100%)";
}
