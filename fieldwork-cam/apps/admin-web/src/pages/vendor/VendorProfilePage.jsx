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
  Typography,
} from "@mui/material";
import {
  BusinessOutlined,
  CalendarMonthOutlined,
  EditOutlined,
  EmailOutlined,
  ImageOutlined,
  LocationOnOutlined,
  PhoneOutlined,
  StarRounded,
  WorkOutlineRounded,
} from "@mui/icons-material";
import {
  getVendorProfileByAuthUserIdApi,
} from "../../api/vendor.api";
import { getProjectsApi } from "../../api/project.api";
import { getInvoicesApi } from "../../api/invoice.api";
import { getTicketsApi } from "../../api/support.api";
import { getStaffApi } from "../../api/staff.api";
import { getNotificationsApi } from "../../api/notification.api";
import VendorEditProfileDialog from "./VendorEditProfileDialog";

const statCards = [
  {
    key: "totalProjects",
    label: "Total Projects",
    color: "#1DA1F2",
    icon: <BusinessOutlined sx={{ fontSize: 18 }} />,
  },
  {
    key: "totalCompleted",
    label: "Completed",
    color: "#22C55E",
    icon: <WorkOutlineRounded sx={{ fontSize: 18 }} />,
  },
  {
    key: "totalActiveProjects",
    label: "Active Now",
    color: "#F59E0B",
    icon: <WorkOutlineRounded sx={{ fontSize: 18 }} />,
  },
  {
    key: "approvalRate",
    label: "Avg Rating",
    color: "#D4B5A5",
    icon: <StarRounded sx={{ fontSize: 18 }} />,
    formatter: (value) => formatRating(value),
  },
];

export default function VendorProfilePage() {
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [staff, setStaff] = useState([]);
  const [notifications, setNotifications] = useState([]);
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
        invoicesResponse,
        ticketsResponse,
        staffResponse,
        notificationsResponse,
      ] = await Promise.allSettled([
        getVendorProfileByAuthUserIdApi(),
        getProjectsApi(),
        getInvoicesApi(),
        getTicketsApi(),
        getStaffApi(),
        getNotificationsApi(),
      ]);

      const unwrap = (result) =>
        result.status === "fulfilled" ? result.value?.data || result.value || [] : [];

      const profileData =
        profileResponse.status === "fulfilled"
          ? profileResponse.value?.data || profileResponse.value || null
          : null;

      setProfile(profileData);
      setProjects(Array.isArray(unwrap(projectsResponse)) ? unwrap(projectsResponse) : []);
      setInvoices(Array.isArray(unwrap(invoicesResponse)) ? unwrap(invoicesResponse) : []);
      setTickets(Array.isArray(unwrap(ticketsResponse)) ? unwrap(ticketsResponse) : []);
      setStaff(Array.isArray(unwrap(staffResponse)) ? unwrap(staffResponse) : []);
      setNotifications(
        Array.isArray(unwrap(notificationsResponse)) ? unwrap(notificationsResponse) : [],
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load vendor profile",
      );
      setProfile(null);
      setProjects([]);
      setInvoices([]);
      setTickets([]);
      setStaff([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const user = useMemo(() => profile?.user || {}, [profile]);
  const meta = useMemo(() => profile?.meta || {}, [profile]);
  const stats = useMemo(() => {
    const completedProjects = projects.filter((item) =>
      ["Approved", "Completed"].includes(item.status),
    ).length;
    const activeProjects = projects.filter((item) =>
      ["New", "In Progress", "Submitted", "Retake Requested"].includes(item.status),
    ).length;
    const submittedProjects = projects.filter((item) =>
      ["Submitted", "Approved", "Completed", "Rejected"].includes(item.status),
    ).length;
    const approvedProjects = projects.filter((item) =>
      ["Approved", "Completed"].includes(item.status),
    ).length;

    return {
      totalProjects: projects.length,
      totalCompleted: completedProjects,
      totalActiveProjects: activeProjects,
      approvalRate: submittedProjects
        ? (approvedProjects / submittedProjects) * 5
        : Number(profile?.stats?.approvalRate || 0),
    };
  }, [profile?.stats?.approvalRate, projects]);

  const activity = useMemo(() => {
    const notificationActivity = [...notifications]
      .sort(
        (a, b) =>
          new Date(b.createdAt || b.updatedAt).getTime() -
          new Date(a.createdAt || a.updatedAt).getTime(),
      )
      .slice(0, 5)
      .map((item) => ({
        id: item._id || item.id,
        title: item.title || "Notification",
        subtitle: item.message || "",
        timeAgo: formatRelativeTime(item.createdAt || item.updatedAt),
        color: activityColor(item.type || item.entityType),
      }));

    if (notificationActivity.length) {
      return notificationActivity;
    }

    return [
      ...tickets.map((item) => ({
        id: `ticket-${item._id || item.id}`,
        title: item.subject || item.title || "Support ticket updated",
        subtitle: item.statusLabel || item.status || "Ticket activity",
        timeAgo: formatRelativeTime(item.updatedAt || item.createdAt),
        color: "#F59E0B",
        sortTime: new Date(item.updatedAt || item.createdAt).getTime(),
      })),
      ...projects.map((item) => ({
        id: `project-${item._id || item.id}`,
        title: `${item.title || "Project"} ${vendorProjectVerb(item.status)}`,
        subtitle: item.workOrderNumber || item.serviceType || "Project activity",
        timeAgo: formatRelativeTime(item.updatedAt || item.createdAt),
        color: "#3B82F6",
        sortTime: new Date(item.updatedAt || item.createdAt).getTime(),
      })),
    ]
      .filter((item) => !Number.isNaN(item.sortTime))
      .sort((a, b) => b.sortTime - a.sortTime)
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        timeAgo: item.timeAgo,
        color: item.color,
      }));
  }, [notifications, projects, tickets]);

  const recentProjects = useMemo(
    () =>
      [...projects]
        .sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt).getTime() -
            new Date(a.updatedAt || a.createdAt).getTime(),
        )
        .slice(0, 4)
        .map((project) => {
          const linkedInvoice = invoices.find((item) => item.projectId === (project._id || project.id));
          const pendingAmount =
            linkedInvoice && String(linkedInvoice.status || "").toUpperCase() !== "PAID"
              ? Number(linkedInvoice.totalDue || linkedInvoice.amount || 0)
              : 0;

          return {
            id: project.workOrderNumber || project._id || project.id,
            clientName: project.clientName || "Client",
            projectName: project.title || "Untitled Project",
            amount: Number(linkedInvoice?.totalDue || linkedInvoice?.amount || 0),
            pendingAmount,
          };
        }),
    [invoices, projects],
  );

  const quickInfo = useMemo(
    () => [
      { label: "Company", value: meta?.companyName || "" },
      { label: "Website", value: meta?.website || "" },
      { label: "Location", value: user?.location || meta?.serviceArea || meta?.address || "" },
      { label: "Member Since", value: meta?.memberSince || user?.createdAt || null },
      {
        label: "Team Size",
        value: staff.length ? `${staff.length} photographers` : "",
      },
    ],
    [meta?.address, meta?.companyName, meta?.memberSince, meta?.serviceArea, meta?.website, staff.length, user?.createdAt, user?.location],
  );

  const fullName = user?.fullName || "Vendor User";
  const companyName = meta?.companyName || "";
  const jobTitle = user?.jobTitle || meta?.jobTitle || "";
  const bio = user?.bio || meta?.bio || "";
  const email = user?.email || meta?.businessEmail || "";
  const phone = user?.phone || meta?.businessPhone || "";
  const location = user?.location || meta?.serviceArea || meta?.address || "";
  const website = meta?.website || "";
  const serviceTypes = meta?.serviceTypes || [];
  const joinedAt = meta?.memberSince || user?.createdAt;
  const avatarUrl = user?.profilePhotoUrl || meta?.profilePhotoUrl || "";
  const bannerImageUrl = user?.bannerImageUrl || meta?.bannerImageUrl || "";
  const isActive = String(user?.status || "").toUpperCase() === "ACTIVE";

  if (loading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={2}
        sx={{ minHeight: 360 }}
      >
        <CircularProgress />
        <Typography sx={{ color: "#6B7280", fontWeight: 600 }}>
          Loading vendor profile...
        </Typography>
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
      <Card
        sx={{
          borderRadius: 1,
          overflow: "hidden",
          border: "1px solid #E9E1DB",
          boxShadow: "none",
        }}
      >
        <Box
          sx={{
            height: 132,
            background: bannerImageUrl
              ? `center / cover no-repeat url(${bannerImageUrl})`
              : "linear-gradient(180deg, rgba(247,247,247,1) 0%, rgba(224,224,224,1) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#1F2937",
          }}
        >
          {!bannerImageUrl ? <ImageOutlined sx={{ fontSize: 56, opacity: 0.85 }} /> : null}
        </Box>

        <Box sx={{ px: { xs: 2, md: 2.5 }, pb: 2.25 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={1.5}
            sx={{ mt: -2.8 }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.75}
              alignItems={{ xs: "flex-start", sm: "flex-end" }}
            >
              <Avatar
                src={avatarUrl}
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: 1,
                  border: "3px solid #FFFFFF",
                  boxShadow: "none",
                  bgcolor: "#A5B58A",
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                {!avatarUrl ? getInitials(fullName) : null}
              </Avatar>

              <Box sx={{ pt: { xs: 0, sm: 1.9 } }}>
                <Stack
                  direction="row"
                  spacing={0.9}
                  alignItems="center"
                  flexWrap="wrap"
                >
                  <Typography
                    sx={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: "#1F2937",
                      lineHeight: 1.15,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {fullName}
                  </Typography>

                  <InlineStatusChip active={isActive} />

                  {Number(stats?.approvalRate || 0) > 0 ? (
                    <Stack
                      direction="row"
                      spacing={0.35}
                      alignItems="center"
                      sx={{ color: "#F59E0B" }}
                    >
                      <StarRounded sx={{ fontSize: 16 }} />
                      <Typography
                        sx={{ fontSize: 12.5, fontWeight: 600, color: "#4B5563" }}
                      >
                        {formatRating(stats?.approvalRate)}
                      </Typography>
                    </Stack>
                  ) : null}
                </Stack>

                <Typography
                  sx={{ mt: 0.45, fontSize: 13, color: "#9CA3AF", fontWeight: 500 }}
                >
                  {jobTitle}
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="contained"
              startIcon={<EditOutlined />}
              onClick={() => setOpenEdit(true)}
              sx={{
                alignSelf: { xs: "stretch", md: "center" },
                minWidth: 128,
                minHeight: 38,
                px: 1.75,
                borderRadius: 1,
                bgcolor: "#E9CFC2",
                color: "#785D50",
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "#DFC1B3",
                  boxShadow: "none",
                },
              }}
            >
              Edit Profile
            </Button>
          </Stack>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 1.2, md: 2 }}
            flexWrap="wrap"
            useFlexGap
            sx={{ mt: 1.8, color: "#7A7E87" }}
          >
            {email ? (
              <MetaItem icon={<EmailOutlined sx={{ fontSize: 16 }} />} text={email} />
            ) : null}
            {phone ? (
              <MetaItem icon={<PhoneOutlined sx={{ fontSize: 16 }} />} text={phone} />
            ) : null}
            {location ? (
              <MetaItem
                icon={<LocationOnOutlined sx={{ fontSize: 16 }} />}
                text={location}
              />
            ) : null}
            {companyName ? (
              <MetaItem
                icon={<BusinessOutlined sx={{ fontSize: 16 }} />}
                text={companyName}
              />
            ) : null}
            {joinedAt ? (
              <MetaItem
                icon={<CalendarMonthOutlined sx={{ fontSize: 16 }} />}
                text={`Joined ${formatDate(joinedAt)}`}
              />
            ) : null}
          </Stack>
        </Box>
      </Card>

      <Box
        sx={{
          mt: 1.5,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: 1.5,
        }}
      >
        {statCards.map((item) => (
          <StatCard
            key={item.key}
            label={item.label}
            color={item.color}
            icon={item.icon}
            value={
              item.formatter
                ? item.formatter(stats?.[item.key])
                : stats?.[item.key] ?? 0
            }
          />
        ))}
      </Box>

      <Box
        sx={{
          mt: 1.5,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 2fr) 320px" },
          gap: 1.5,
          alignItems: "start",
        }}
      >
        <Stack spacing={1.5}>
          <SectionCard title="About">
            {bio ? (
              <Typography
                sx={{
                  fontSize: 13.5,
                  lineHeight: 1.75,
                  color: "#7A7E87",
                  maxWidth: 760,
                }}
              >
                {bio}
              </Typography>
            ) : (
              <EmptyState label="No about information added yet." />
            )}
          </SectionCard>

          <SectionCard title="Specialties">
            {serviceTypes.length ? (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {serviceTypes.map((item) => (
                  <Chip
                    key={item}
                    label={item}
                    sx={{
                      bgcolor: "#FFF2E8",
                      color: "#F97316",
                      border: "1px solid #FFD4B5",
                      fontWeight: 700,
                      height: 28,
                      borderRadius: 2,
                    }}
                  />
                ))}
              </Stack>
            ) : (
              <EmptyState label="No specialties added yet." />
            )}
          </SectionCard>

          <SectionCard title="Recent Projects">
            {recentProjects.length ? (
              <Stack spacing={1.1}>
                {recentProjects.map((project) => (
                  <ProjectRow key={project.id} project={project} />
                ))}
              </Stack>
            ) : (
              <EmptyState label="No recent projects available." />
            )}
          </SectionCard>
        </Stack>

        <Stack spacing={1.5}>
          <SectionCard title="Quick Info" bodySx={{ p: 0 }}>
            {quickInfo.some((item) => item?.value) ? (
              <Stack divider={<Divider flexItem />} sx={{ px: 2.25 }}>
                {quickInfo
                  .filter((item) => item?.value)
                  .map((item) => (
                    <QuickInfoRow
                      key={item.label}
                      item={item}
                      website={website}
                    />
                  ))}
              </Stack>
            ) : (
              <Box sx={{ px: 2.25, pb: 2.1 }}>
                <EmptyState label="No quick info available." compact />
              </Box>
            )}
          </SectionCard>

          <SectionCard title="Recent Activity">
            {activity.length ? (
              <Stack spacing={1.6}>
                {activity.map((item) => (
                  <ActivityRow key={item.id} item={item} />
                ))}
              </Stack>
            ) : (
              <EmptyState label="No recent activity available." />
            )}
          </SectionCard>
        </Stack>
      </Box>

      <VendorEditProfileDialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        profile={profile}
        onSaved={fetchProfile}
      />
    </Box>
  );
}

function SectionCard({ title, children, bodySx }) {
  return (
    <Card
      sx={{
        borderRadius: 1,
        border: "1px solid #E9E1DB",
        boxShadow: "none",
      }}
    >
      <Box sx={{ px: 2, pt: 2, pb: 1.1 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1F2937" }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ px: 2, pb: 2, ...bodySx }}>{children}</Box>
    </Card>
  );
}

function StatCard({ icon, color, value, label }) {
  return (
    <Card
      sx={{
        p: 2,
        borderRadius: 1,
        border: "1px solid #E9E1DB",
        boxShadow: "none",
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          bgcolor: color,
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </Box>

      <Typography
        sx={{
          mt: 1.4,
          fontSize: 22,
          fontWeight: 700,
          lineHeight: 1.1,
          color: "#1F2937",
        }}
      >
        {value}
      </Typography>

      <Typography sx={{ mt: 1.1, fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>
        {label}
      </Typography>
    </Card>
  );
}

function InlineStatusChip({ active }) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Box
        sx={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          bgcolor: active ? "#22C55E" : "#9CA3AF",
        }}
      />
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 700,
          color: active ? "#22C55E" : "#9CA3AF",
        }}
      >
        {active ? "Active" : "Inactive"}
      </Typography>
    </Stack>
  );
}

function MetaItem({ icon, text }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Box sx={{ color: "#9CA3AF", display: "flex", alignItems: "center" }}>
        {icon}
      </Box>
      <Typography sx={{ fontSize: 12.5, color: "#9CA3AF", fontWeight: 500 }}>
        {text}
      </Typography>
    </Stack>
  );
}

function QuickInfoRow({ item, website }) {
  const value =
    item.label === "Website" && website
      ? website.replace(/^https?:\/\//, "")
      : item.label === "Member Since"
        ? formatDate(item.value)
        : item.value;

  return (
    <Box sx={{ py: 1.45 }}>
      <Typography sx={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>
        {item.label}
      </Typography>
      <Typography
        sx={{
          mt: 0.45,
          fontSize: 12.5,
          color: item.label === "Website" && website ? "#3B82F6" : "#374151",
          fontWeight: 600,
          wordBreak: "break-word",
        }}
      >
        {value || "N/A"}
      </Typography>
    </Box>
  );
}

function ProjectRow({ project }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.2fr 1.35fr 0.5fr 0.45fr" },
        gap: 1.2,
        alignItems: "center",
        px: 1.5,
        py: 1.25,
        border: "1px solid #E9E1DB",
        borderRadius: 1,
      }}
    >
      <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}>
        {project.clientName}
      </Typography>

      <Box>
        <Typography sx={{ fontSize: 12.5, color: "#374151", fontWeight: 600 }}>
          {project.projectName}
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: "#9CA3AF", mt: 0.25, fontWeight: 500 }}>
          {project.id}
        </Typography>
      </Box>

      <Typography
        sx={{
          fontSize: 12.5,
          fontWeight: 600,
          color: "#374151",
          textAlign: { md: "right" },
        }}
      >
        {formatCurrency(project.amount)}
      </Typography>

      <Typography
        sx={{
          fontSize: 12,
          color: "#9CA3AF",
          textAlign: { md: "right" },
          fontWeight: 600,
        }}
      >
        {formatCurrency(project.pendingAmount)}
      </Typography>
    </Box>
  );
}

function ActivityRow({ item }) {
  return (
    <Stack direction="row" spacing={1} alignItems="flex-start">
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          bgcolor: item.color || "#22C55E",
          mt: 0.7,
          flexShrink: 0,
        }}
      />
      <Box>
        <Typography sx={{ fontSize: 12.5, color: "#374151", fontWeight: 600 }}>
          {item.title}
        </Typography>
        <Typography sx={{ mt: 0.25, fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>
          {item.timeAgo || item.subtitle || ""}
        </Typography>
      </Box>
    </Stack>
  );
}

function getInitials(value = "") {
  const parts = value.trim().split(" ").filter(Boolean);
  if (!parts.length) return "V";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "V";
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatRating(value) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount.toFixed(1) : "0.0";
}

function formatRelativeTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(diffMs)) return "";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function activityColor(type = "") {
  const normalized = String(type || "").toUpperCase();
  if (normalized.includes("PAYMENT") || normalized.includes("INVOICE")) return "#22C55E";
  if (normalized.includes("SUPPORT")) return "#F59E0B";
  if (normalized.includes("STAFF")) return "#8B5CF6";
  return "#3B82F6";
}

function vendorProjectVerb(status = "") {
  if (status === "Submitted") return "submitted";
  if (status === "Approved") return "approved";
  if (status === "Completed") return "completed";
  if (status === "Retake Requested") return "needs retake";
  if (status === "In Progress") return "in progress";
  return "updated";
}

function EmptyState({ label, compact = false }) {
  return (
    <Box
      sx={{
        minHeight: compact ? 76 : 112,
        border: "1px dashed #E6DED7",
        borderRadius: 1,
        bgcolor: "#FCFAF8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Typography
        sx={{ fontSize: 12.5, color: "#A1A7B0", textAlign: "center", fontWeight: 500 }}
      >
        {label}
      </Typography>
    </Box>
  );
}
