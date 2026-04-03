import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import {
  AccessTimeOutlined,
  BusinessCenterOutlined,
  CalendarMonthOutlined,
  EditOutlined,
  EmailOutlined,
  LocationOnOutlined,
  PhoneOutlined,
  PublicOutlined,
  ShieldOutlined,
} from "@mui/icons-material";
import { getAdminProfileApi } from "../../api/admin.api";
import { getProjectsApi } from "../../api/project.api";
import { getVendorsApi } from "../../api/vendor.api";
import { getInvoicesApi } from "../../api/invoice.api";
import { getTicketsApi } from "../../api/support.api";
import EditProfileDialog from "./EditProfileDialog";

const formatRelativeTime = (value) => {
  if (!value) return "";

  const now = Date.now();
  const date = new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.round((now - date) / 60000));

  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffMinutes < 1440) return `${Math.round(diffMinutes / 60)} hours ago`;
  return `${Math.round(diffMinutes / 1440)} days ago`;
};

export default function ProfilePage() {
  const [tab, setTab] = useState(0);
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openEdit, setOpenEdit] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        profileResponse,
        projectsResponse,
        vendorsResponse,
        invoicesResponse,
        ticketsResponse,
      ] = await Promise.allSettled([
        getAdminProfileApi(),
        getProjectsApi(),
        getVendorsApi(),
        getInvoicesApi(),
        getTicketsApi(),
      ]);

      const safeData = (result) =>
        result.status === "fulfilled"
          ? result.value?.data || result.value || []
          : [];

      const profileData =
        profileResponse.status === "fulfilled"
          ? profileResponse.value?.data || profileResponse.value || null
          : null;

      setProfile(profileData);
      setProjects(Array.isArray(safeData(projectsResponse)) ? safeData(projectsResponse) : []);
      setVendors(Array.isArray(safeData(vendorsResponse)) ? safeData(vendorsResponse) : []);
      setInvoices(Array.isArray(safeData(invoicesResponse)) ? safeData(invoicesResponse) : []);
      setTickets(Array.isArray(safeData(ticketsResponse)) ? safeData(ticketsResponse) : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load profile",
      );
      setProfile(null);
      setProjects([]);
      setVendors([]);
      setInvoices([]);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const user = useMemo(() => profile?.user || profile || {}, [profile]);
  const meta = useMemo(() => profile?.meta || user?.meta || {}, [profile, user]);

  const fullName = user?.fullName || "";
  const email = user?.email || "";
  const phone = user?.phone || "";
  const location = user?.location || meta?.location || "";
  const department = user?.department || meta?.department || "";
  const timezone = user?.timezone || meta?.timezone || "";
  const joinedAt = user?.createdAt || meta?.memberSince || "";
  const lastLogin = meta?.lastLogin || user?.lastLogin || "";
  const status = user?.status || "";
  const role = user?.role || "";
  const jobTitle = user?.jobTitle || meta?.jobTitle || "";
  const avatarUrl = user?.profilePhotoUrl || meta?.profilePhotoUrl || "";
  const bannerImageUrl = user?.bannerImageUrl || meta?.bannerImageUrl || "";

  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const totalVendors = vendors.length;
    const totalCompleted = projects.filter((project) =>
      ["Completed", "Approved"].includes(project.status),
    ).length;

    const submitted = projects.filter((project) =>
      ["Submitted", "Approved", "Completed", "Rejected"].includes(project.status),
    ).length;
    const approved = projects.filter((project) =>
      ["Approved", "Completed"].includes(project.status),
    ).length;

    return {
      totalProjects,
      totalVendors,
      totalCompleted,
      approvalRate: submitted ? Math.round((approved / submitted) * 100) : 0,
    };
  }, [projects, vendors]);

  const recentActivity = useMemo(() => {
    const projectItems = projects
      .filter((project) => project?.updatedAt || project?.createdAt)
      .slice(0, 4)
      .map((project) => ({
      title:
        project.status === "Approved" || project.status === "Completed"
          ? `Approved project ${project.workOrderNumber || project.title}`
          : `Updated project ${project.workOrderNumber || project.title}`,
      subtitle: [project.address, project.serviceType].filter(Boolean).join(" — "),
      timestamp: project.updatedAt || project.createdAt,
      color:
        project.status === "Approved" || project.status === "Completed"
          ? "#22C55E"
          : "#D88B72",
    }))
      .filter((item) => item.title && item.subtitle);

    const invoiceItems = invoices
      .filter((invoice) => invoice?.invoiceNumber && invoice?.vendorName)
      .slice(0, 2)
      .map((invoice) => ({
      title: `Created new invoice ${invoice.invoiceNumber}`.trim(),
      subtitle: `${invoice.vendorName} — $${Number(
        invoice.totalDue || invoice.amount || 0,
      ).toLocaleString()}`,
      timestamp: invoice.createdAt,
      color: "#8B8178",
    }));

    const ticketItems = tickets
      .filter((ticket) => ticket?.ticketId && ticket?.vendorName && ticket?.subject)
      .slice(0, 2)
      .map((ticket) => ({
      title: `Resolved support ticket ${ticket.ticketId}`.trim(),
      subtitle: `${ticket.vendorName} — ${ticket.subject}`,
      timestamp: ticket.updatedAt || ticket.createdAt,
      color: "#9C7448",
    }));

    return [...projectItems, ...invoiceItems, ...ticketItems]
      .filter((item) => item.timestamp)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5)
      .map((item) => ({
        ...item,
        timeAgo: formatRelativeTime(item.timestamp),
      }));
  }, [projects, invoices, tickets]);

  const initials = (value = "") => {
    const parts = value.trim().split(" ").filter(Boolean);
    if (!parts.length) return "";
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "A";
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  };

  const statusChip = (value = "") => {
    const map = {
      ACTIVE: { bg: "#EAFBF1", color: "#22C55E", label: "Active" },
      INACTIVE: { bg: "#F3F4F6", color: "#6B7280", label: "Inactive" },
      SUSPENDED: { bg: "#FEE2E2", color: "#DC2626", label: "Suspended" },
    };
    const current = map[value] || {
      bg: "#F3F4F6",
      color: "#6B7280",
      label: value || "-",
    };

    return (
      <Chip
        label={current.label}
        size="small"
        sx={{
          bgcolor: current.bg,
          color: current.color,
          fontWeight: 700,
          borderRadius: 1,
          height: 24,
        }}
      />
    );
  };

  if (loading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: 320 }}
        spacing={2}
      >
        <CircularProgress />
        <Typography color="text.secondary">Loading profile...</Typography>
      </Stack>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
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
          Profile
        </Typography>
        <Typography sx={{ mt: 0.45, color: "#9CA3AF", fontSize: 13, fontWeight: 500 }}>
          Manage your account settings and preferences.
        </Typography>

        <Card
          sx={{
            mt: 2,
            borderRadius: 1.2,
            border: "1px solid #EDE7E1",
            boxShadow: "none",
            overflow: "hidden",
            bgcolor: "#FFFFFF",
          }}
        >
          <Box
            sx={{
              height: 98,
              background: bannerImageUrl
                ? `center / cover no-repeat url(${bannerImageUrl})`
                : "linear-gradient(180deg, rgba(248,232,224,0.85) 0%, rgba(244,239,235,0.65) 100%)",
            }}
          />

          <Box sx={{ px: 2.5, pb: 2.5 }}>
            <Stack
              direction={{ xs: "column", lg: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", lg: "center" }}
              spacing={2}
              sx={{ mt: -3.2 }}
            >
              <Stack direction="row" spacing={1.6} alignItems="center">
                <Avatar
                  src={avatarUrl}
                  sx={{
                    width: 62,
                    height: 62,
                    bgcolor: "#CBB8AD",
                    fontSize: 20,
                    fontWeight: 800,
                    border: "3px solid white",
                    boxShadow: "0 8px 18px rgba(31,41,55,0.08)",
                  }}
                >
                  {!avatarUrl ? initials(fullName) : null}
                </Avatar>

                <Box sx={{ pt: 1.1 }}>
                  <Stack direction="row" spacing={0.9} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#1F2937" }}>
                      {fullName || "Unnamed Profile"}
                    </Typography>
                    {role ? (
                      <Chip
                        label={role === "ADMIN" ? "Admin" : role}
                        size="small"
                        sx={{
                          height: 20,
                          borderRadius: 1,
                          bgcolor: "#EAFBF1",
                          color: "#22C55E",
                          fontWeight: 700,
                          fontSize: 10,
                        }}
                      />
                    ) : null}
                  </Stack>

                  {jobTitle ? (
                    <Typography sx={{ mt: 0.3, fontSize: 12, color: "#8F8A84", fontWeight: 500 }}>
                      {jobTitle}
                    </Typography>
                  ) : null}
                </Box>
              </Stack>

              <Button
                variant="contained"
                startIcon={<EditOutlined sx={{ fontSize: 14 }} />}
                onClick={() => setOpenEdit(true)}
                sx={{
                  borderRadius: 1,
                  minHeight: 32,
                  px: 1.4,
                  bgcolor: "#D8BAA9",
                  color: "#FFFFFF",
                  textTransform: "none",
                  fontSize: 11.5,
                  fontWeight: 600,
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#CBA895", boxShadow: "none" },
                }}
              >
                Edit Profile
              </Button>
            </Stack>

            <Box
              sx={{
                mt: 2,
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr 1fr",
                  md: "repeat(4, minmax(0, 1fr))",
                },
                gap: 1.1,
                maxWidth: 540,
              }}
            >
              <MiniStat value={stats.totalProjects} label="Projects" />
              <MiniStat value={stats.totalVendors} label="Vendors" />
              <MiniStat value={stats.totalCompleted} label="Completed" />
              <MiniStat value={`${stats.approvalRate}%`} label="Approval" />
            </Box>
          </Box>
        </Card>

        <Box sx={{ mt: 1.7 }}>
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            sx={{
              minHeight: 40,
              "& .MuiTab-root": {
                minHeight: 38,
                minWidth: 110,
                textTransform: "none",
                fontWeight: 600,
                fontSize: 11.5,
                borderRadius: 1,
                mr: 0.9,
                color: "#8F8A84",
                bgcolor: "#F7F4F1",
              },
              "& .Mui-selected": {
                color: "#1F2937 !important",
                bgcolor: "#FFFFFF",
                border: "1px solid #EDE7E1",
              },
              "& .MuiTabs-indicator": {
                display: "none",
              },
            }}
          >
            <Tab label="Personal Info" />
            <Tab label="Security" />
            <Tab label="Notifications" />
          </Tabs>
        </Box>

        {tab === 0 ? (
          <>
            <Box
              sx={{
                mt: 1.6,
                display: "grid",
                gridTemplateColumns: { xs: "1fr", xl: "1fr 0.9fr" },
                gap: 1.5,
              }}
            >
              <Card sx={infoCardSx}>
                <Typography sx={sectionTitleSx}>Contact Information</Typography>

                <Stack spacing={2.1} sx={{ mt: 2.2 }}>
                  <InfoRow
                    icon={<EmailOutlined sx={{ fontSize: 16 }} />}
                    label="Email"
                    value={email || "-"}
                  />
                  <InfoRow
                    icon={<PhoneOutlined sx={{ fontSize: 16 }} />}
                    label="Phone"
                    value={phone || "-"}
                  />
                  <InfoRow
                    icon={<LocationOnOutlined sx={{ fontSize: 16 }} />}
                    label="Location"
                    value={location || "-"}
                  />
                  <InfoRow
                    icon={<BusinessCenterOutlined sx={{ fontSize: 16 }} />}
                    label="Department"
                    value={department || "-"}
                  />
                </Stack>
              </Card>

              <Card sx={infoCardSx}>
                <Typography sx={sectionTitleSx}>Account Details</Typography>

                <Stack spacing={2.1} sx={{ mt: 2.2 }}>
                  <InfoRow
                    icon={<PublicOutlined sx={{ fontSize: 16 }} />}
                    label="Timezone"
                    value={timezone || "-"}
                  />
                  <InfoRow
                    icon={<CalendarMonthOutlined sx={{ fontSize: 16 }} />}
                    label="Member Since"
                    value={
                      joinedAt
                        ? new Date(joinedAt).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "-"
                    }
                  />
                  <InfoRow
                    icon={<AccessTimeOutlined sx={{ fontSize: 16 }} />}
                    label="Last Login"
                    value={
                      lastLogin
                        ? new Date(lastLogin).toLocaleString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : "-"
                    }
                  />
                  <InfoRow
                    icon={<ShieldOutlined sx={{ fontSize: 16 }} />}
                    label="Account Status"
                    value={status ? statusChip(status) : "-"}
                    isNode
                  />
                </Stack>
              </Card>
            </Box>

            <Card sx={{ ...infoCardSx, mt: 1.5 }}>
              <Typography sx={sectionTitleSx}>Recent Activity</Typography>

              <Stack spacing={1.8} sx={{ mt: 2.1 }}>
                {recentActivity.length ? (
                  recentActivity.map((item, index) => (
                    <Box key={`${item.title}-${index}`}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        spacing={2}
                      >
                        <Stack direction="row" spacing={1.1} alignItems="flex-start">
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              bgcolor: item.color || "#22C55E",
                              mt: 0.8,
                            }}
                          />
                          <Box>
                            <Typography
                              sx={{
                                fontSize: 12.75,
                                fontWeight: 600,
                                color: "#1F2937",
                              }}
                            >
                              {item.title}
                            </Typography>
                            <Typography
                              sx={{
                                mt: 0.2,
                                fontSize: 11,
                                color: "#A39D96",
                                fontWeight: 500,
                              }}
                            >
                              {item.subtitle}
                            </Typography>
                          </Box>
                        </Stack>

                        <Typography sx={{ fontSize: 11, color: "#A39D96", flexShrink: 0 }}>
                          {item.timeAgo}
                        </Typography>
                      </Stack>

                      {index !== recentActivity.length - 1 ? (
                        <Divider sx={{ mt: 1.3, borderColor: "#F2ECE6" }} />
                      ) : null}
                    </Box>
                  ))
                ) : (
                  <EmptyStateBox label="No recent activity available" />
                )}
              </Stack>
            </Card>
          </>
        ) : tab === 1 ? (
          <Card sx={{ ...infoCardSx, mt: 1.6 }}>
            <Typography sx={sectionTitleSx}>Security</Typography>
            <Typography sx={{ mt: 1.4, fontSize: 13, color: "#9CA3AF" }}>
              Security settings data is not available yet.
            </Typography>
          </Card>
        ) : (
          <Card sx={{ ...infoCardSx, mt: 1.6 }}>
            <Typography sx={sectionTitleSx}>Notifications</Typography>
            <Typography sx={{ mt: 1.4, fontSize: 13, color: "#9CA3AF" }}>
              Notification preferences data is not available yet.
            </Typography>
          </Card>
        )}
      </Box>

      <EditProfileDialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        profile={profile}
        onSaved={() => fetchProfile()}
      />
    </Box>
  );
}

function MiniStat({ value, label }) {
  return (
    <Box
      sx={{
        p: 1.3,
        borderRadius: 1,
        border: "1px solid #F0EBE6",
        bgcolor: "#FBF8F6",
      }}
    >
      <Typography
        sx={{ fontSize: 24, fontWeight: 700, color: "#1F2937", lineHeight: 1 }}
      >
        {value}
      </Typography>
      <Typography
        sx={{
          mt: 0.55,
          fontSize: 10.5,
          color: "#A39D96",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function InfoRow({ icon, label, value, isNode = false }) {
  return (
    <Stack direction="row" spacing={1.1} alignItems="flex-start">
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: 1,
          bgcolor: "#FBF4F0",
          color: "#D88B72",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          mt: 0.1,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: 11.5, color: "#A39D96", fontWeight: 600 }}>
          {label}
        </Typography>
        {isNode ? (
          <Box sx={{ mt: 0.35 }}>{value}</Box>
        ) : (
          <Typography
            sx={{ mt: 0.35, fontSize: 13, color: "#1F2937", fontWeight: 600 }}
          >
            {value}
          </Typography>
        )}
      </Box>
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

const infoCardSx = {
  p: 2,
  borderRadius: 1.2,
  border: "1px solid #EDE7E1",
  boxShadow: "none",
  bgcolor: "#FFFFFF",
};

const sectionTitleSx = {
  fontSize: 15,
  fontWeight: 700,
  color: "#1F2937",
};
