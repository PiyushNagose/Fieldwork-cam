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
  ArrowOutwardOutlined,
  CalendarMonthOutlined,
  CheckCircleOutlineOutlined,
  CircleOutlined,
  FmdGoodOutlined,
  MoreHorizOutlined,
  RemoveRedEyeOutlined,
  TrendingDownOutlined,
  TrendingUpOutlined,
} from "@mui/icons-material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { getProjectsApi } from "../../api/project.api";
import { getVendorsApi } from "../../api/vendor.api";
import { getInvoicesApi } from "../../api/invoice.api";
import { getNotificationsApi } from "../../api/notification.api";
import { useAuth } from "../../auth/AuthContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
);

const MONTHS_TO_SHOW = 12;

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [projectsRes, vendorsRes, invoicesRes, notificationsRes] =
          await Promise.allSettled([
            getProjectsApi(),
            getVendorsApi(),
            getInvoicesApi(),
            getNotificationsApi(),
          ]);

        const unwrap = (result) =>
          result.status === "fulfilled"
            ? result.value?.data || result.value || []
            : [];

        setProjects(Array.isArray(unwrap(projectsRes)) ? unwrap(projectsRes) : []);
        setVendors(Array.isArray(unwrap(vendorsRes)) ? unwrap(vendorsRes) : []);
        setInvoices(Array.isArray(unwrap(invoicesRes)) ? unwrap(invoicesRes) : []);
        setNotifications(
          Array.isArray(unwrap(notificationsRes)) ? unwrap(notificationsRes) : [],
        );
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            "Failed to load dashboard",
        );
        setProjects([]);
        setVendors([]);
        setInvoices([]);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const dashboard = useMemo(() => {
    const currentMonth = monthFromDate(new Date());
    const previousMonth = previousMonthKey(currentMonth);

    const newProjects = projects.filter((item) => item.status === "New").length;
    const inProgress = projects.filter((item) => item.status === "In Progress").length;
    const underReview = projects.filter((item) =>
      ["Submitted", "Retake Requested"].includes(item.status),
    ).length;
    const completed = projects.filter((item) =>
      ["Completed", "Approved"].includes(item.status),
    ).length;

    const newProjectsPrev = projects.filter(
      (item) => item.status === "New" && monthFromDate(item.createdAt) === previousMonth,
    ).length;
    const inProgressPrev = projects.filter(
      (item) =>
        item.status === "In Progress" &&
        monthFromDate(item.updatedAt || item.createdAt) === previousMonth,
    ).length;
    const underReviewPrev = projects.filter(
      (item) =>
        ["Submitted", "Retake Requested"].includes(item.status) &&
        monthFromDate(item.updatedAt || item.createdAt) === previousMonth,
    ).length;
    const completedPrev = projects.filter(
      (item) =>
        ["Completed", "Approved"].includes(item.status) &&
        monthFromDate(item.updatedAt || item.createdAt) === previousMonth,
    ).length;

    const monthKeys = getRecentMonthKeys(MONTHS_TO_SHOW);

    const earningsSeries = monthKeys.map((monthKey) => {
      const revenue = invoices
        .filter(
          (item) =>
            normalizeInvoiceStatus(item.status) === "PAID" &&
            monthFromDate(item.paymentDate || item.updatedAt || item.createdAt) ===
              monthKey,
        )
        .reduce((sum, item) => sum + Number(item.amount || item.totalDue || 0), 0);

      const outstanding = invoices
        .filter(
          (item) =>
            normalizeInvoiceStatus(item.status) !== "PAID" &&
            monthFromDate(item.createdAt) === monthKey,
        )
        .reduce((sum, item) => sum + Number(item.amount || item.totalDue || 0), 0);

      return {
        label: formatMonthKey(monthKey),
        revenue,
        outstanding,
      };
    });

    const vendorPerformance = vendors
      .map((vendor) => {
        const vendorProjects = projects.filter(
          (item) => item.assignedVendorAuthUserId === vendor.authUserId,
        );

        const submittedCount = vendorProjects.filter((item) =>
          ["Submitted", "Approved", "Completed", "Rejected"].includes(item.status),
        ).length;
        const approvedCount = vendorProjects.filter((item) =>
          ["Approved", "Completed"].includes(item.status),
        ).length;

        return {
          label: vendor.companyName || vendor.fullName || "Unnamed Vendor",
          value: submittedCount ? Math.round((approvedCount / submittedCount) * 100) : 0,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const recentActivity = [...notifications]
      .sort(
        (a, b) =>
          new Date(b.createdAt || b.updatedAt).getTime() -
          new Date(a.createdAt || a.updatedAt).getTime(),
      )
      .slice(0, 6)
      .map((item) => ({
        id: item._id || item.id,
        type: item.type || item.entityType || "SYSTEM",
        title: item.title || "Notification",
        subtitle: item.message || item.description || "",
        timeAgo: formatRelativeTime(item.createdAt || item.updatedAt),
      }));

    const fallbackActivity = [
      ...projects.slice(0, 20).map((item) => ({
        id: `project-${item._id || item.id}`,
        type: "PROJECT",
        title: projectActivityTitle(item),
        subtitle: `${item.workOrderNumber || "Project"} • ${item.title || "Untitled project"}`,
        timeAgo: formatRelativeTime(item.updatedAt || item.createdAt),
        sortTime: new Date(item.updatedAt || item.createdAt).getTime(),
      })),
      ...invoices.slice(0, 20).map((item) => ({
        id: `invoice-${item._id || item.id}`,
        type: "INVOICE",
        title: invoiceActivityTitle(item),
        subtitle: `${item.invoiceNumber || "Invoice"} • ${item.projectName || item.projectCode || "Linked project"}`,
        timeAgo: formatRelativeTime(item.paymentDate || item.updatedAt || item.createdAt),
        sortTime: new Date(item.paymentDate || item.updatedAt || item.createdAt).getTime(),
      })),
      ...vendors.slice(0, 20).map((item) => ({
        id: `vendor-${item._id || item.id}`,
        type: "STAFF",
        title: "Vendor profile available",
        subtitle: `${item.companyName || item.fullName || "Vendor"} is active in the system`,
        timeAgo: formatRelativeTime(item.joinedAt || item.createdAt),
        sortTime: new Date(item.joinedAt || item.createdAt).getTime(),
      })),
    ]
      .filter((item) => !Number.isNaN(item.sortTime))
      .sort((a, b) => b.sortTime - a.sortTime)
      .slice(0, 6)
      .map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        subtitle: item.subtitle,
        timeAgo: item.timeAgo,
      }));

    const recentSubmissions = [...projects]
      .filter((item) =>
        ["New", "Submitted", "Approved", "In Progress", "Retake Requested"].includes(
          item.status,
        ),
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime(),
      )
      .slice(0, 5)
      .map((item) => ({
        id: item._id || item.id,
        title: item.title || item.workOrderNumber || "Untitled",
        location: shortLocation(item.address),
        date: formatDate(item.updatedAt || item.dueDate || item.createdAt),
        status: mapSubmissionStatus(item.status),
      }));

    return {
      cards: [
        {
          label: "New Projects",
          value: newProjects,
          delta: calculateDelta(newProjects, newProjectsPrev),
          icon: <TrendingUpOutlined sx={{ fontSize: 16 }} />,
          accent: "#22C55E",
        },
        {
          label: "In Progress",
          value: inProgress,
          delta: calculateDelta(inProgress, inProgressPrev),
          icon: <TrendingUpOutlined sx={{ fontSize: 16 }} />,
          accent: "#22C55E",
        },
        {
          label: "Under Review",
          value: underReview,
          delta: calculateDelta(underReview, underReviewPrev),
          icon: <RemoveRedEyeOutlined sx={{ fontSize: 16 }} />,
          accent: "#EF4444",
        },
        {
          label: "Completed",
          value: completed,
          delta: calculateDelta(completed, completedPrev),
          icon: <CheckCircleOutlineOutlined sx={{ fontSize: 16 }} />,
          accent: "#22C55E",
        },
      ],
      earningsSeries,
      vendorPerformance,
      recentActivity: recentActivity.length ? recentActivity : fallbackActivity,
      recentSubmissions,
    };
  }, [projects, vendors, invoices, notifications]);

  const earningsChartData = {
    labels: dashboard.earningsSeries.map((item) => item.label),
    datasets: [
      {
        label: "Revenue",
        data: dashboard.earningsSeries.map((item) => item.revenue),
        borderColor: "#D88B72",
        backgroundColor: "rgba(216,139,114,0.12)",
        fill: true,
        tension: 0.42,
        pointRadius: 0,
        borderWidth: 2.5,
      },
      {
        label: "Outstanding",
        data: dashboard.earningsSeries.map((item) => item.outstanding),
        borderColor: "#A8A29E",
        backgroundColor: "rgba(168,162,158,0.06)",
        fill: false,
        tension: 0.42,
        pointRadius: 0,
        borderWidth: 2.2,
      },
    ],
  };

  const earningsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: dashboard.earningsSeries.some(
          (item) => item.revenue > 0 || item.outstanding > 0,
        ),
        position: "top",
        align: "end",
        labels: {
          boxWidth: 8,
          usePointStyle: true,
          pointStyle: "circle",
          color: "#8D8D8D",
          font: {
            size: 11,
            weight: 600,
          },
          padding: 14,
        },
      },
      tooltip: {
        backgroundColor: "#111827",
        titleColor: "#fff",
        bodyColor: "#fff",
        displayColors: false,
        callbacks: {
          label: (context) => `$${Number(context.raw || 0).toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#A3A3A3", font: { size: 11, weight: 500 } },
      },
      y: {
        grid: { color: "#F1ECE7" },
        border: { display: false },
        ticks: {
          color: "#A3A3A3",
          font: { size: 11, weight: 500 },
          callback: (value) => `$${Number(value).toLocaleString()}`,
        },
      },
    },
  };

  const vendorChartData = {
    labels: dashboard.vendorPerformance.map((item) => item.label),
    datasets: [
      {
        label: "Quality Score",
        data: dashboard.vendorPerformance.map((item) => item.value),
        backgroundColor: dashboard.vendorPerformance.map((item, index) =>
          index < 2 ? "#D88B72" : "#A8A29E",
        ),
        borderRadius: 999,
        barThickness: 12,
      },
    ],
  };

  const vendorChartOptions = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#111827",
        titleColor: "#fff",
        bodyColor: "#fff",
        displayColors: false,
        callbacks: {
          label: (context) => `${context.raw}%`,
        },
      },
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: "#A3A3A3",
          font: { size: 11, weight: 500 },
          callback: (value) => `${value}%`,
        },
      },
      y: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: "#8B8B8B",
          font: { size: 11, weight: 500 },
        },
      },
    },
  };

  if (loading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: "60vh" }}
        spacing={2}
      >
        <CircularProgress />
        <Typography color="text.secondary">Loading dashboard...</Typography>
      </Stack>
    );
  }

  if (error) {
    return (
      <Card
        sx={{
          p: 3,
          borderRadius: 1,
          border: "1px solid #E9E1DB",
          boxShadow: "none",
        }}
      >
        <Typography color="error" fontWeight={700}>
          {error}
        </Typography>
      </Card>
    );
  }

  const firstName = user?.fullName?.split(" ")?.[0] || "there";

  return (
    <Box
      sx={{
        px: { xs: 1.25, md: 1.75 },
        py: { xs: 1.25, md: 1.75 },
        bgcolor: "#F8F5F2",
        minHeight: "100%",
      }}
    >
      <Typography
        sx={{
          fontSize: 26,
          fontWeight: 700,
          color: "#1F2937",
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
        }}
      >
        Dashboard
      </Typography>

      <Typography
        sx={{
          mt: 0.5,
          color: "#9CA3AF",
          fontSize: 12.5,
          fontWeight: 500,
        }}
      >
        Welcome back, {firstName}. Here&apos;s what&apos;s happening today.
      </Typography>

      <Box
        sx={{
          mt: 2,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 1.25,
        }}
      >
        {dashboard.cards.map((item) => (
          <SummaryCard key={item.label} item={item} />
        ))}
      </Box>

      <Box
        sx={{
          mt: 1.25,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" },
          gap: 1.25,
        }}
      >
        <CardPanel title="Earnings Analytics" subtitle="Revenue vs outstanding over time">
          <Box sx={{ mt: 1.7, height: 255 }}>
            {dashboard.earningsSeries.some(
              (item) => item.revenue > 0 || item.outstanding > 0,
            ) ? (
              <Line data={earningsChartData} options={earningsChartOptions} />
            ) : (
              <EmptyChartBox label="No earnings analytics available" />
            )}
          </Box>
        </CardPanel>

        <CardPanel
          title="Vendor Performance"
          subtitle="Quality scores by vendor"
          actionLabel="View All"
        >
          <Box sx={{ mt: 1.7, height: 255 }}>
            {dashboard.vendorPerformance.length ? (
              <Bar data={vendorChartData} options={vendorChartOptions} />
            ) : (
              <EmptyChartBox label="No vendor performance data available" />
            )}
          </Box>
        </CardPanel>
      </Box>

      <Box
        sx={{
          mt: 1.25,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" },
          gap: 1.25,
        }}
      >
        <CardPanel title="Recent Activity" actionLabel="View All">
          <Stack sx={{ mt: 1.75 }} spacing={1.4}>
            {dashboard.recentActivity.length ? (
              dashboard.recentActivity.map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))
            ) : (
              <EmptyListBox label="No recent activity available" />
            )}
          </Stack>
        </CardPanel>

        <CardPanel title="Recent Submissions" actionLabel="View All">
          <Box sx={{ mt: 1.5 }}>
            {dashboard.recentSubmissions.length ? (
              <>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1.5fr 0.85fr 0.8fr 30px",
                    gap: 1,
                    px: 0.2,
                    pb: 0.9,
                  }}
                >
                  {["PROJECT LOCATION", "DATE", "STATUS"].map((label) => (
                    <Typography key={label} sx={tableHeadSx}>
                      {label}
                    </Typography>
                  ))}
                  <Box />
                </Box>

                <Stack spacing={1}>
                  {dashboard.recentSubmissions.map((item) => (
                    <SubmissionRow key={item.id} item={item} />
                  ))}
                </Stack>
              </>
            ) : (
              <EmptyListBox label="No recent submissions available" />
            )}
          </Box>
        </CardPanel>
      </Box>
    </Box>
  );
}

function SummaryCard({ item }) {
  const positive = item.delta.value >= 0;
  const TrendIcon = positive ? TrendingUpOutlined : TrendingDownOutlined;

  return (
    <Card
      sx={{
        p: 1.75,
        borderRadius: 1.5,
        border: "1px solid #E9E1DB",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 6px 18px rgba(31,41,55,0.03)",
        bgcolor: "#FFFFFF",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          right: -6,
          top: -10,
          width: 50,
          height: 50,
          borderRadius: "50%",
          bgcolor: "#F2EEEA",
          opacity: 0.95,
        }}
      />

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Typography sx={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>
          {item.label}
        </Typography>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 1.2,
            bgcolor: `${item.accent}14`,
            color: item.accent,
            display: "grid",
            placeItems: "center",
            zIndex: 1,
          }}
        >
          {item.icon}
        </Box>
      </Stack>

      <Typography
        sx={{
          mt: 0.7,
          fontSize: 20,
          fontWeight: 700,
          color: "#1F2937",
          lineHeight: 1.1,
        }}
      >
        {item.value}
      </Typography>

      <Stack direction="row" spacing={0.45} alignItems="center" sx={{ mt: 1.15 }}>
        <TrendIcon sx={{ fontSize: 15, color: item.delta.color }} />
        <Typography sx={{ color: item.delta.color, fontSize: 12, fontWeight: 700 }}>
          {item.delta.label}
        </Typography>
        <Typography sx={{ color: "#9CA3AF", fontSize: 12, fontWeight: 500 }}>
          vs last month
        </Typography>
      </Stack>
    </Card>
  );
}

function CardPanel({ title, subtitle, actionLabel, children }) {
  return (
    <Card
      sx={{
        p: 1.75,
        borderRadius: 1.5,
        border: "1px solid #E9E1DB",
        boxShadow: "0 6px 18px rgba(31,41,55,0.03)",
        bgcolor: "#FFFFFF",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1F2937" }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography
              sx={{ mt: 0.35, color: "#9CA3AF", fontSize: 12.5, fontWeight: 500 }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </Box>

        {actionLabel ? (
          <Button
            variant="text"
            sx={{
              color: "#8B8B8B",
              bgcolor: "#F8F3EF",
              px: 1.25,
              minHeight: 28,
              borderRadius: 1.2,
              textTransform: "none",
              fontSize: 11.5,
              fontWeight: 600,
              minWidth: "auto",
            }}
          >
            {actionLabel}
          </Button>
        ) : null}
      </Stack>

      {children}
    </Card>
  );
}

function ActivityRow({ item }) {
  const visual = activityVisual(item.type);

  return (
    <Stack direction="row" justifyContent="space-between" spacing={1.2} alignItems="flex-start">
      <Stack direction="row" spacing={1} sx={{ minWidth: 0 }}>
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            bgcolor: visual.bg,
            color: visual.color,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          {visual.icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1F2937" }}>
            {item.title}
          </Typography>
          <Typography
            sx={{
              mt: 0.25,
              fontSize: 11.5,
              color: "#9CA3AF",
              lineHeight: 1.35,
            }}
          >
            {item.subtitle}
          </Typography>
        </Box>
      </Stack>

      <Typography
        sx={{
          fontSize: 10.5,
          color: "#B0B5BE",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {item.timeAgo}
      </Typography>
    </Stack>
  );
}

function SubmissionRow({ item }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1.5fr 0.85fr 0.8fr 30px",
        gap: 1,
        alignItems: "center",
        py: 0.65,
        borderBottom: "1px solid rgba(233,225,219,0.55)",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 12.5,
            fontWeight: 700,
            color: "#1F2937",
            lineHeight: 1.25,
          }}
        >
          {item.title}
        </Typography>
        <Stack direction="row" spacing={0.45} alignItems="center" sx={{ mt: 0.25 }}>
          <FmdGoodOutlined sx={{ fontSize: 12, color: "#B6BCC6" }} />
          <Typography sx={{ fontSize: 11.5, color: "#9CA3AF" }}>
            {item.location}
          </Typography>
        </Stack>
      </Box>

      <Stack direction="row" spacing={0.45} alignItems="center">
        <CalendarMonthOutlined sx={{ fontSize: 12, color: "#B6BCC6" }} />
        <Typography sx={{ fontSize: 11.5, color: "#6B7280" }}>{item.date}</Typography>
      </Stack>

      <Box>{submissionStatusChip(item.status)}</Box>

      <Button
        sx={{
          minWidth: 0,
          width: 28,
          height: 28,
          borderRadius: 1.2,
          p: 0,
          color: "#A4ABB5",
        }}
      >
        <MoreHorizOutlined sx={{ fontSize: 18 }} />
      </Button>
    </Box>
  );
}

function EmptyChartBox({ label }) {
  return (
    <Box
      sx={{
        height: "100%",
        borderRadius: 1.3,
        border: "1px dashed #E5DED7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#B0B5BE",
        fontSize: 13,
        bgcolor: "#FCFAF8",
      }}
    >
      {label}
    </Box>
  );
}

function EmptyListBox({ label }) {
  return (
    <Box
      sx={{
        minHeight: 180,
        borderRadius: 1.3,
        border: "1px dashed #E5DED7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#B0B5BE",
        fontSize: 13,
        bgcolor: "#FCFAF8",
      }}
    >
      {label}
    </Box>
  );
}

function activityVisual(type = "") {
  const normalized = String(type).toUpperCase();

  if (normalized.includes("PROJECT")) {
    return {
      bg: "#FDEFE9",
      color: "#D88B72",
      icon: <ArrowOutwardOutlined sx={{ fontSize: 14 }} />,
    };
  }
  if (normalized.includes("PAYMENT") || normalized.includes("INVOICE")) {
    return {
      bg: "#EAFBF1",
      color: "#22C55E",
      icon: <CheckCircleOutlineOutlined sx={{ fontSize: 14 }} />,
    };
  }
  if (normalized.includes("SUPPORT")) {
    return {
      bg: "#F3F4F6",
      color: "#8B8B8B",
      icon: <RemoveRedEyeOutlined sx={{ fontSize: 14 }} />,
    };
  }
  return {
    bg: "#EEF2FF",
    color: "#6366F1",
    icon: <CircleOutlined sx={{ fontSize: 12 }} />,
  };
}

function submissionStatusChip(status = "") {
  const map = {
    New: { bg: "#FDEFE9", color: "#D88B72" },
    "In Review": { bg: "#EEF2FF", color: "#6366F1" },
    Approved: { bg: "#EAFBF1", color: "#22C55E" },
    "In Progress": { bg: "#F7F0DD", color: "#D6A83D" },
    Submitted: { bg: "#EEF2FF", color: "#6366F1" },
    Rejected: { bg: "#FEE2E2", color: "#DC2626" },
    "Retake Requested": { bg: "#FEE2E2", color: "#DC2626" },
  };

  const current = map[status] || { bg: "#F3F4F6", color: "#6B7280" };

  return (
    <Box
      sx={{
        px: 1.05,
        py: 0.45,
        borderRadius: 999,
        bgcolor: current.bg,
        color: current.color,
        fontSize: 11,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 76,
      }}
    >
      {status || "-"}
    </Box>
  );
}

function calculateDelta(current, previous) {
  if (!previous) {
    return {
      value: current,
      label: `+${current}`,
      color: "#22C55E",
    };
  }

  const percent = Math.round(((current - previous) / previous) * 100);
  return {
    value: percent,
    label: `${percent >= 0 ? "+" : ""}${percent}%`,
    color: percent >= 0 ? "#22C55E" : "#EF4444",
  };
}

function normalizeInvoiceStatus(status = "") {
  return String(status).trim().toUpperCase();
}

function getRecentMonthKeys(count) {
  const result = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    );
  }

  return result;
}

function monthFromDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function previousMonthKey(key) {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthKey(key) {
  const [year, month] = key.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleString("en-US", { month: "short" });
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
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

function shortLocation(address = "") {
  if (!address) return "";
  const parts = address
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
  }
  return address;
}

function mapSubmissionStatus(status = "") {
  if (status === "Submitted") return "In Review";
  if (status === "Retake Requested") return "In Review";
  return status || "New";
}

function projectActivityTitle(project) {
  if (project.status === "Submitted") return "New site photos uploaded";
  if (project.status === "Approved") return "Inspection approved";
  if (project.status === "Retake Requested") return "Comment from reviewer";
  if (project.status === "In Progress") return "Deadline approaching";
  if (project.status === "New") return "New vendor onboarded";
  return "Project updated";
}

function invoiceActivityTitle(invoice) {
  const status = normalizeInvoiceStatus(invoice.status);
  if (status === "PAID") return "Payment received";
  if (status === "APPROVED") return "Invoice approved";
  return "Invoice pending review";
}

const tableHeadSx = {
  fontSize: 10.5,
  fontWeight: 800,
  color: "#B7BDC7",
  letterSpacing: "0.04em",
};
