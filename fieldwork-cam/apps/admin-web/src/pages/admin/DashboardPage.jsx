import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowOutwardOutlined,
  AssignmentTurnedInOutlined,
  VisibilityOutlined,
  CheckCircleOutlineOutlined,
  FmdGoodOutlined,
  CalendarMonthOutlined,
  MoreHorizOutlined,
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
import { Line, Bar } from "react-chartjs-2";
import { getProjectsApi } from "../../api/project.api";
import { getVendorsApi } from "../../api/vendor.api";
import { getInvoicesApi } from "../../api/invoice.api";
import { getNotificationsApi } from "../../api/notification.api";

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

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [notifications, setNotifications] = useState([]);

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

      const unwrap = (res) =>
        res.status === "fulfilled" ? res.value?.data || res.value || [] : [];

      setProjects(
        Array.isArray(unwrap(projectsRes)) ? unwrap(projectsRes) : [],
      );
      setVendors(Array.isArray(unwrap(vendorsRes)) ? unwrap(vendorsRes) : []);
      setInvoices(
        Array.isArray(unwrap(invoicesRes)) ? unwrap(invoicesRes) : [],
      );
      setNotifications(
        Array.isArray(unwrap(notificationsRes)) ? unwrap(notificationsRes) : [],
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load dashboard",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const stats = useMemo(() => {
    const newProjects = projects.filter((p) => p.status === "New").length;
    const activeProjects = projects.filter((p) =>
      ["In Progress", "Submitted"].includes(p.status),
    ).length;
    const pendingApprovals = projects.filter((p) =>
      ["Submitted", "Retake Requested"].includes(p.status),
    ).length;
    const completedProjects = projects.filter((p) =>
      ["Completed", "Approved"].includes(p.status),
    ).length;

    const paidInvoices = invoices
      .filter((i) => normalizeInvoiceStatus(i.status) === "PAID")
      .reduce((sum, i) => sum + Number(i.amount || i.totalDue || 0), 0);

    return {
      newProjects,
      activeProjects,
      pendingApprovals,
      completedProjects,
      revenue: paidInvoices,
    };
  }, [projects, invoices]);

  const topCards = useMemo(
    () => [
      {
        label: "New Projects",
        value: stats.newProjects,
        trend: `${stats.newProjects}`,
        trendColor: "#22C55E",
        icon: <ArrowOutwardOutlined sx={{ fontSize: 15 }} />,
      },
      {
        label: "In Progress",
        value: stats.activeProjects,
        trend: `${stats.activeProjects}`,
        trendColor: "#22C55E",
        icon: <AssignmentTurnedInOutlined sx={{ fontSize: 15 }} />,
      },
      {
        label: "Under Review",
        value: stats.pendingApprovals,
        trend: `${stats.pendingApprovals}`,
        trendColor: "#EF4444",
        icon: <VisibilityOutlined sx={{ fontSize: 15 }} />,
      },
      {
        label: "Completed",
        value: stats.completedProjects,
        trend: `${stats.completedProjects}`,
        trendColor: "#22C55E",
        icon: <CheckCircleOutlineOutlined sx={{ fontSize: 15 }} />,
      },
    ],
    [stats],
  );

  const earningsSeries = useMemo(() => {
    const monthKeys = getRecentMonthKeys(8);

    return monthKeys.map((key) => {
      const value = invoices
        .filter(
          (item) =>
            normalizeInvoiceStatus(item.status) === "PAID" &&
            monthFromDate(
              item.paymentDate || item.updatedAt || item.createdAt,
            ) === key,
        )
        .reduce(
          (sum, item) => sum + Number(item.amount || item.totalDue || 0),
          0,
        );

      return {
        label: formatMonthKey(key),
        value,
      };
    });
  }, [invoices]);

  const vendorSeries = useMemo(() => {
    return vendors
      .map((vendor) => {
        const vendorProjects = projects.filter(
          (p) => p.assignedVendorAuthUserId === vendor.authUserId,
        );

        const submittedCount = vendorProjects.filter((p) =>
          ["Submitted", "Approved", "Completed", "Rejected"].includes(p.status),
        ).length;

        const approvedCount = vendorProjects.filter((p) =>
          ["Approved", "Completed"].includes(p.status),
        ).length;

        const value = submittedCount
          ? Math.round((approvedCount / submittedCount) * 100)
          : 0;

        return {
          label: vendor.companyName || vendor.fullName || "Unnamed Vendor",
          value,
          color: value >= 80 ? "#22C55E" : value >= 60 ? "#D6A83D" : "#EF4444",
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [vendors, projects]);

  const recentNotifications = useMemo(() => {
    return [...notifications]
      .sort(
        (a, b) =>
          new Date(b.createdAt || b.updatedAt) -
          new Date(a.createdAt || a.updatedAt),
      )
      .slice(0, 5)
      .map((item) => ({
        id: item._id || item.id,
        title: item.title || "Notification",
        subtitle: item.message || item.description || "",
        timeAgo: formatRelativeTime(item.createdAt || item.updatedAt),
      }));
  }, [notifications]);

  const recentProjects = useMemo(() => {
    return [...projects]
      .sort(
        (a, b) =>
          new Date(b.createdAt || b.updatedAt) -
          new Date(a.createdAt || a.updatedAt),
      )
      .slice(0, 5)
      .map((item) => ({
        id: item._id || item.id,
        title: item.title || "Untitled",
        address: item.title || item.address || "Untitled",
        city: shortLocation(item.address),
        location: shortLocation(item.address),
        date: item.dueDate
          ? formatDate(item.dueDate)
          : item.createdAt
            ? formatDate(item.createdAt)
            : "",
        status: item.status || "",
      }));
  }, [projects]);

  const earningsChartData = {
    labels: earningsSeries.map((item) => item.label),
    datasets: [
      {
        label: "Revenue",
        data: earningsSeries.map((item) => item.value),
        borderColor: "#8C7A70",
        backgroundColor: "rgba(203,184,173,0.16)",
        fill: true,
        tension: 0.42,
        pointRadius: 0,
        borderWidth: 2.5,
      },
    ],
  };

  const earningsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: earningsSeries.some((item) => item.value > 0),
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
    layout: {
      padding: {
        top: 4,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: "#A3A3A3",
          font: {
            size: 11,
            weight: 500,
          },
        },
      },
      y: {
        grid: { color: "#F1ECE7" },
        border: { display: false },
        ticks: {
          color: "#A3A3A3",
          font: {
            size: 11,
            weight: 500,
          },
          callback: (value) => `$${Number(value).toLocaleString()}`,
        },
      },
    },
  };

  const vendorChartData = {
    labels: vendorSeries.map((item) => item.label),
    datasets: [
      {
        label: "Quality Score",
        data: vendorSeries.map((item) => item.value),
        backgroundColor: vendorSeries.map((item) => item.color || "#9C948B"),
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
          font: {
            size: 11,
            weight: 500,
          },
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

  const submissionStatusChip = (status = "") => {
    const map = {
      New: { bg: "#FDEFE9", color: "#D88B72" },
      "In Review": { bg: "#EEF2FF", color: "#6366F1" },
      Approved: { bg: "#EAFBF1", color: "#22C55E" },
      "In Progress": { bg: "#F7F0DD", color: "#D6A83D" },
      Submitted: { bg: "#F3E8FF", color: "#9333EA" },
      Rejected: { bg: "#FEE2E2", color: "#DC2626" },
      "Retake Requested": { bg: "#FEE2E2", color: "#DC2626" },
      Completed: { bg: "#EAFBF1", color: "#22C55E" },
    };

    const current = map[status] || { bg: "#F3F4F6", color: "#6B7280" };

    return (
      <Box
        sx={{
          px: 1.15,
          py: 0.48,
          borderRadius: 999,
          bgcolor: current.bg,
          color: current.color,
          fontSize: 11,
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 78,
        }}
      >
        {status || "—"}
      </Box>
    );
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
        <Button sx={{ mt: 2 }} variant="contained" onClick={fetchDashboard}>
          Retry
        </Button>
      </Card>
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
        Dashboard
      </Typography>

      <Typography
        sx={{
          mt: 0.5,
          color: "#9CA3AF",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        Welcome back. Here's what's happening today.
      </Typography>

      {/* ── Metric cards ── */}
      <Box
        sx={{
          mt: 2.25,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 1.5,
        }}
      >
        {topCards.map((item) => (
          <Card
            key={item.label}
            sx={{
              p: 2,
              borderRadius: 1,
              border: "1px solid #E9E1DB",
              position: "relative",
              overflow: "hidden",
              boxShadow: "none",
              bgcolor: "#FFFFFF",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                right: -6,
                top: -10,
                width: 54,
                height: 54,
                borderRadius: "50%",
                bgcolor: "#F2EEEA",
                opacity: 0.95,
              }}
            />

            <Typography
              sx={{
                fontSize: 12,
                color: "#9CA3AF",
                position: "relative",
                zIndex: 1,
                fontWeight: 500,
              }}
            >
              {item.label}
            </Typography>

            <Typography
              sx={{
                mt: 0.6,
                fontSize: 22,
                fontWeight: 700,
                color: "#1F2937",
                lineHeight: 1.1,
              }}
            >
              {item.value}
            </Typography>

            {item.trend ? (
              <Stack
                direction="row"
                spacing={0.45}
                alignItems="center"
                sx={{ mt: 1.2 }}
              >
                <Box
                  sx={{
                    color: item.trendColor,
                    display: "grid",
                    placeItems: "center",
                    lineHeight: 0,
                  }}
                >
                  {item.icon}
                </Box>

                <Typography
                  sx={{
                    color: item.trendColor,
                    fontSize: 12,
                    fontWeight: 600,
                    lineHeight: 1,
                  }}
                >
                  {item.trend}
                </Typography>

                <Typography
                  sx={{
                    color: "#9CA3AF",
                    fontSize: 12,
                    fontWeight: 500,
                    lineHeight: 1,
                  }}
                >
                  current
                </Typography>
              </Stack>
            ) : null}
          </Card>
        ))}
      </Box>

      {/* ── Charts row ── */}
      <Box
        sx={{
          mt: 1.5,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" },
          gap: 1.5,
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
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 700,
              color: "#1F2937",
              lineHeight: 1.2,
            }}
          >
            Earnings Analytics
          </Typography>

          <Typography
            sx={{ mt: 0.35, color: "#9CA3AF", fontSize: 12.5, fontWeight: 500 }}
          >
            Revenue over time
          </Typography>

          <Box sx={{ mt: 1.75, height: 255 }}>
            {earningsSeries.some((item) => item.value > 0) ? (
              <Line data={earningsChartData} options={earningsChartOptions} />
            ) : (
              <EmptyChartBox label="No earnings analytics available" />
            )}
          </Box>
        </Card>

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
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <Box>
              <Typography
                sx={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#1F2937",
                  lineHeight: 1.2,
                }}
              >
                Vendor Performance
              </Typography>
              <Typography
                sx={{
                  mt: 0.35,
                  color: "#9CA3AF",
                  fontSize: 12.5,
                  fontWeight: 500,
                }}
              >
                Quality scores by vendor
              </Typography>
            </Box>

            <Button
              variant="text"
              sx={{
                color: "#8B8B8B",
                bgcolor: "#F8F3EF",
                px: 1.4,
                minHeight: 30,
                borderRadius: 1.5,
                textTransform: "none",
                fontSize: 11.5,
                fontWeight: 600,
                minWidth: "auto",
              }}
            >
              View All
            </Button>
          </Stack>

          <Box sx={{ mt: 1.75, height: 255 }}>
            {vendorSeries.length ? (
              <Bar data={vendorChartData} options={vendorChartOptions} />
            ) : (
              <EmptyChartBox label="No vendor performance data available" />
            )}
          </Box>
        </Card>
      </Box>

      {/* ── Activity + Submissions row ── */}
      <Box
        sx={{
          mt: 1.5,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" },
          gap: 1.5,
        }}
      >
        {/* Recent Activity */}
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
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 700,
                color: "#1F2937",
                lineHeight: 1.2,
              }}
            >
              Recent Activity
            </Typography>

            <Button
              variant="text"
              sx={{
                color: "#8B8B8B",
                bgcolor: "#F8F3EF",
                px: 1.4,
                minHeight: 30,
                borderRadius: 1.5,
                textTransform: "none",
                fontSize: 11.5,
                fontWeight: 600,
                minWidth: "auto",
              }}
            >
              View All
            </Button>
          </Stack>

          <Stack sx={{ mt: 1.75 }} spacing={1.75}>
            {recentNotifications.length ? (
              recentNotifications.map((item) => (
                <Stack
                  key={item.id}
                  direction="row"
                  justifyContent="space-between"
                  spacing={1.5}
                  alignItems="flex-start"
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#1F2937",
                        lineHeight: 1.3,
                      }}
                    >
                      {item.title}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.35,
                        fontSize: 12,
                        color: "#9CA3AF",
                        lineHeight: 1.35,
                      }}
                    >
                      {item.subtitle}
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      fontSize: 11,
                      color: "#9CA3AF",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {item.timeAgo}
                  </Typography>
                </Stack>
              ))
            ) : (
              <EmptyListBox label="No recent activity available" />
            )}
          </Stack>
        </Card>

        {/* Recent Submissions */}
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
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 700,
                color: "#1F2937",
                lineHeight: 1.2,
              }}
            >
              Recent Submissions
            </Typography>

            <Button
              variant="text"
              sx={{
                color: "#8B8B8B",
                bgcolor: "#F8F3EF",
                px: 1.4,
                minHeight: 30,
                borderRadius: 1.5,
                textTransform: "none",
                fontSize: 11.5,
                fontWeight: 600,
                minWidth: "auto",
              }}
            >
              View All
            </Button>
          </Stack>

          <Box sx={{ mt: 1.5 }}>
            {recentProjects.length ? (
              <>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1.35fr 0.9fr 0.8fr 34px",
                    gap: 1,
                    px: 0.25,
                    pb: 1,
                  }}
                >
                  {["PROJECT LOCATION", "DATE", "STATUS"].map((col) => (
                    <Typography
                      key={col}
                      sx={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        color: "#B7BDC7",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {col}
                    </Typography>
                  ))}
                  <Box />
                </Box>

                <Stack spacing={1.15}>
                  {recentProjects.map((item, index) => (
                    <Box
                      key={item.id || index}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1.35fr 0.9fr 0.8fr 34px",
                        gap: 1,
                        alignItems: "center",
                        py: 0.7,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#1F2937",
                            lineHeight: 1.25,
                          }}
                        >
                          {item.address}
                        </Typography>

                        <Stack
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                          sx={{ mt: 0.35 }}
                        >
                          <FmdGoodOutlined
                            sx={{ fontSize: 13, color: "#B6BCC6" }}
                          />
                          <Typography
                            sx={{
                              fontSize: 11.5,
                              color: "#9CA3AF",
                              lineHeight: 1.2,
                            }}
                          >
                            {item.city || item.location}
                          </Typography>
                        </Stack>
                      </Box>

                      <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                        sx={{ minWidth: 0 }}
                      >
                        <CalendarMonthOutlined
                          sx={{ fontSize: 13, color: "#B6BCC6" }}
                        />
                        <Typography
                          sx={{
                            fontSize: 11.5,
                            color: "#6B7280",
                            lineHeight: 1.2,
                          }}
                        >
                          {item.date}
                        </Typography>
                      </Stack>

                      <Box>{submissionStatusChip(item.status)}</Box>

                      <Button
                        sx={{
                          minWidth: 0,
                          width: 28,
                          height: 28,
                          borderRadius: 1,
                          p: 0,
                          color: "#A4ABB5",
                        }}
                      >
                        <MoreHorizOutlined sx={{ fontSize: 18 }} />
                      </Button>
                    </Box>
                  ))}
                </Stack>
              </>
            ) : (
              <EmptyListBox label="No recent submissions available" />
            )}
          </Box>
        </Card>
      </Box>
    </Box>
  );
}

function EmptyChartBox({ label }) {
  return (
    <Box
      sx={{
        height: "100%",
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
      {label}
    </Box>
  );
}

function EmptyListBox({ label }) {
  return (
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
      {label}
    </Box>
  );
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
