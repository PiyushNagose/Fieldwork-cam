import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import {
  GroupsOutlined,
  CheckCircleOutlineOutlined,
  ScheduleOutlined,
  VerifiedOutlined,
} from "@mui/icons-material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { getProjectsApi } from "../../api/project.api";
import { getVendorsApi } from "../../api/vendor.api";
import { getInvoicesApi } from "../../api/invoice.api";
import { getServicesApi } from "../../api/service.api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

const MONTHS_TO_SHOW = 9;

export default function AnalyticsPage() {
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [services, setServices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalyticsDependencies = async () => {
    try {
      setLoading(true);
      setError("");

      const [projectsRes, vendorsRes, invoicesRes, servicesRes] =
        await Promise.allSettled([
          getProjectsApi(),
          getVendorsApi(),
          getInvoicesApi(),
          getServicesApi(),
        ]);

      const safeData = (result) =>
        result.status === "fulfilled"
          ? result.value?.data || result.value || []
          : [];

      setProjects(
        Array.isArray(safeData(projectsRes)) ? safeData(projectsRes) : [],
      );
      setVendors(
        Array.isArray(safeData(vendorsRes)) ? safeData(vendorsRes) : [],
      );
      setInvoices(
        Array.isArray(safeData(invoicesRes)) ? safeData(invoicesRes) : [],
      );
      setServices(
        Array.isArray(safeData(servicesRes)) ? safeData(servicesRes) : [],
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load analytics",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsDependencies();
  }, []);

  const analytics = useMemo(() => {
    const monthKeys = getRecentMonthKeys(MONTHS_TO_SHOW);

    const totalVendors = vendors.length;
    const activeVendors = vendors.filter(
      (v) => (v.status || "").toUpperCase() === "ACTIVE",
    ).length;

    const completedProjects = projects.filter((p) =>
      ["Completed", "Approved"].includes(p.status),
    );

    const submittedProjects = projects.filter((p) =>
      ["Submitted", "Approved", "Completed"].includes(p.status),
    );

    const avgCompletionTimeDays =
      calculateAverageCompletionDays(completedProjects);
    const avgApprovalScore = calculateApprovalScore(projects);

    const monthlyProjectsSubmitted = monthKeys.map(
      (monthKey) =>
        projects.filter(
          (p) =>
            monthFromDate(p.createdAt) === monthKey &&
            ["Submitted", "Approved", "Completed"].includes(p.status),
        ).length,
    );

    const monthlyProjectsCompleted = monthKeys.map(
      (monthKey) =>
        projects.filter(
          (p) =>
            monthFromDate(p.updatedAt || p.createdAt) === monthKey &&
            ["Completed"].includes(p.status),
        ).length,
    );

    const paidInvoices = invoices.filter(
      (i) => (i.status || "").toUpperCase() === "PAID",
    );

    const monthlyRevenue = monthKeys.map((monthKey) =>
      paidInvoices
        .filter((i) => monthFromDate(i.paymentDate || i.createdAt) === monthKey)
        .reduce((sum, i) => sum + Number(i.amount || 0), 0),
    );

    const vendorApprovalRate = vendors
      .map((vendor) => {
        const vendorProjects = projects.filter(
          (p) => p.assignedVendorAuthUserId === vendor.authUserId,
        );

        const submitted = vendorProjects.filter((p) =>
          ["Submitted", "Approved", "Completed", "Rejected"].includes(p.status),
        ).length;

        const approved = vendorProjects.filter((p) =>
          ["Approved", "Completed"].includes(p.status),
        ).length;

        const score =
          submitted > 0 ? Math.round((approved / submitted) * 100) : 0;

        return {
          label: vendor.companyName || vendor.fullName || "Unnamed Vendor",
          value: score,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const rejectionCounts = {};
    projects
      .filter((p) => p.status === "Rejected")
      .forEach((project) => {
        const reason =
          project.rejectionReason ||
          project.rejectReason ||
          project.retakeReason ||
          "";
        if (!reason) return;
        rejectionCounts[reason] = (rejectionCounts[reason] || 0) + 1;
      });

    const rejectionReasons = Object.entries(rejectionCounts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);

    const totalRejections = rejectionReasons.reduce(
      (sum, item) => sum + item.count,
      0,
    );

    const serviceBreakdownMap = {};
    projects.forEach((project) => {
      const key = project.serviceType || "Unknown";
      serviceBreakdownMap[key] = (serviceBreakdownMap[key] || 0) + 1;
    });

    const serviceBreakdown = Object.entries(serviceBreakdownMap).map(
      ([label, value]) => ({
        label,
        value,
      }),
    );

    return {
      summary: {
        totalVendors,
        activeVendors,
        avgCompletionTimeDays,
        avgApprovalScore,
      },
      charts: {
        monthLabels: monthKeys.map(formatMonthKey),
        monthlyProjectsSubmitted,
        monthlyProjectsCompleted,
        monthlyRevenue,
        vendorApprovalRate,
        rejectionReasons,
        totalRejections,
        serviceBreakdown,
      },
    };
  }, [projects, vendors, invoices, services]);

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          boxWidth: 8,
          usePointStyle: true,
          pointStyle: "circle",
          font: {
            size: 11,
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#9CA3AF", font: { size: 11 } },
      },
      y: {
        grid: { color: "#F2ECE6" },
        border: { display: false },
        ticks: { color: "#9CA3AF", font: { size: 11 } },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  const monthlyProjectsData = {
    labels: analytics.charts.monthLabels,
    datasets: [
      {
        label: "Submitted",
        data: analytics.charts.monthlyProjectsSubmitted,
        borderColor: "#D88B72",
        backgroundColor: "rgba(216,139,114,0.12)",
        fill: true,
        tension: 0.42,
        pointRadius: 0,
        borderWidth: 3,
      },
      {
        label: "Completed",
        data: analytics.charts.monthlyProjectsCompleted,
        borderColor: "#22C55E",
        backgroundColor: "rgba(34,197,94,0.10)",
        fill: true,
        tension: 0.42,
        pointRadius: 0,
        borderWidth: 3,
      },
    ],
  };

  const revenueData = {
    labels: analytics.charts.monthLabels,
    datasets: [
      {
        label: "Revenue",
        data: analytics.charts.monthlyRevenue,
        borderColor: "#6E8EDC",
        backgroundColor: "rgba(110,142,220,0.12)",
        fill: true,
        tension: 0.42,
        pointRadius: 0,
        borderWidth: 3,
      },
    ],
  };

  const vendorApprovalData = {
    labels: analytics.charts.vendorApprovalRate.map((item) => item.label),
    datasets: [
      {
        label: "Approval Rate",
        data: analytics.charts.vendorApprovalRate.map((item) => item.value),
        backgroundColor: analytics.charts.vendorApprovalRate.map((item) =>
          item.value >= 80
            ? "#22C55E"
            : item.value >= 60
              ? "#EAB308"
              : "#EF4444",
        ),
        borderRadius: 8,
        barThickness: 16,
      },
    ],
  };

  const serviceColors = [
    "#D88B72",
    "#5B8DEF",
    "#A8A29E",
    "#8B5CF6",
    "#22C55E",
    "#F59E0B",
  ];

  const serviceBreakdownData = {
    labels: analytics.charts.serviceBreakdown.map((item) => item.label),
    datasets: [
      {
        data: analytics.charts.serviceBreakdown.map((item) => item.value),
        backgroundColor: analytics.charts.serviceBreakdown.map(
          (_, index) => serviceColors[index % serviceColors.length],
        ),
        borderWidth: 0,
      },
    ],
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
        <Typography color="text.secondary">Loading analytics...</Typography>
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
      <Typography
        sx={{
          fontSize: 28,
          fontWeight: 700,
          color: "#1F2937",
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
        }}
      >
        Analytics
      </Typography>

      <Typography
        sx={{
          mt: 0.5,
          color: "#9CA3AF",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        Field operations performance insights and trends.
      </Typography>

      <Box
        sx={{
          mt: 2.25,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            xl: "repeat(4, 1fr)",
          },
          gap: 1.5,
        }}
      >
        <MetricCard
          icon={<GroupsOutlined sx={{ fontSize: 18, color: "#7A7A7A" }} />}
          label="Total Vendors"
          value={analytics.summary.totalVendors}
          deltaText={`${Math.max(
            analytics.summary.totalVendors - analytics.summary.activeVendors,
            0,
          )} vs inactive`}
          accent="#22C55E"
        />
        <MetricCard
          icon={<GroupsOutlined sx={{ fontSize: 18, color: "#22C55E" }} />}
          label="Active Vendors"
          value={analytics.summary.activeVendors}
          deltaText={`${analytics.summary.activeVendors} active now`}
          accent="#22C55E"
        />
        <MetricCard
          icon={<ScheduleOutlined sx={{ fontSize: 18, color: "#D88B72" }} />}
          label="Avg. Completion Time"
          value={`${analytics.summary.avgCompletionTimeDays}d`}
          deltaText="based on completed projects"
          accent="#22C55E"
        />
        <MetricCard
          icon={<VerifiedOutlined sx={{ fontSize: 18, color: "#5B8DEF" }} />}
          label="Avg. Approval Score"
          value={`${analytics.summary.avgApprovalScore}%`}
          deltaText="approved vs submitted"
          accent="#22C55E"
        />
      </Box>

      <Box
        sx={{
          mt: 1.5,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" },
          gap: 1.5,
        }}
      >
        <CardPanel
          title="Monthly Projects"
          subtitle="Completed vs submitted volume"
        >
          <Box sx={{ mt: 1.5, height: 260 }}>
            {analytics.charts.monthLabels.length ? (
              <Line data={monthlyProjectsData} options={lineChartOptions} />
            ) : (
              <EmptyChart label="No monthly project data available" />
            )}
          </Box>
        </CardPanel>

        <CardPanel
          title="Revenue Analytics"
          subtitle="Monthly revenue trend"
          rightBadge={
            analytics.charts.monthlyRevenue.some((value) => value > 0)
              ? "+ real revenue"
              : null
          }
        >
          <Box sx={{ mt: 1.5, height: 260 }}>
            {analytics.charts.monthlyRevenue.some((value) => value > 0) ? (
              <Line data={revenueData} options={lineChartOptions} />
            ) : (
              <EmptyChart label="No invoice revenue data available" />
            )}
          </Box>
        </CardPanel>
      </Box>

      <Box
        sx={{
          mt: 1.5,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr 0.95fr" },
          gap: 1.5,
          alignItems: "stretch",
        }}
      >
        <CardPanel
          title="Vendor Approval Rate"
          subtitle="Quality scores by vendor"
        >
          <Box sx={{ mt: 1.5, height: 320 }}>
            {analytics.charts.vendorApprovalRate.length ? (
              <Bar
                data={vendorApprovalData}
                options={{
                  ...lineChartOptions,
                  indexAxis: "y",
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    x: {
                      grid: { color: "#F2ECE6" },
                      border: { display: false },
                      ticks: { color: "#9CA3AF", font: { size: 11 } },
                      max: 100,
                    },
                    y: {
                      grid: { display: false },
                      border: { display: false },
                      ticks: { color: "#9CA3AF", font: { size: 11 } },
                    },
                  },
                }}
              />
            ) : (
              <EmptyChart label="No vendor performance data available" />
            )}
          </Box>
        </CardPanel>

        <CardPanel
          title="Rejection Reasons"
          subtitle="Top causes for submission rejections"
        >
          <Box sx={{ mt: 1.25 }}>
            {analytics.charts.rejectionReasons.length ? (
              <Stack spacing={1.4}>
                {analytics.charts.rejectionReasons.map((item, index) => {
                  const percent = analytics.charts.totalRejections
                    ? Math.round(
                        (item.count / analytics.charts.totalRejections) * 100,
                      )
                    : 0;

                  const color =
                    index === 0
                      ? "#EF4444"
                      : index === 1
                        ? "#D88B72"
                        : index === 2
                          ? "#EAB308"
                          : "#A8A29E";

                  return (
                    <Box key={item.label}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography
                          sx={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#374151",
                          }}
                        >
                          {item.label}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: "#8C8C8C",
                            fontWeight: 600,
                          }}
                        >
                          {item.count} &nbsp; {percent}%
                        </Typography>
                      </Stack>

                      <Box
                        sx={{
                          mt: 0.6,
                          width: "100%",
                          height: 8,
                          borderRadius: 999,
                          bgcolor: "#EEE8E2",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            width: `${percent}%`,
                            height: "100%",
                            bgcolor: color,
                            borderRadius: 999,
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })}

                <Typography
                  sx={{
                    pt: 1.2,
                    fontSize: 13,
                    color: "#6B7280",
                    fontWeight: 700,
                  }}
                >
                  Total Rejections &nbsp; {analytics.charts.totalRejections}
                </Typography>
              </Stack>
            ) : (
              <EmptyChart label="No rejection reason data available" />
            )}
          </Box>
        </CardPanel>

        <CardPanel
          title="Service Breakdown"
          subtitle="Projects by service type"
        >
          <Box sx={{ mt: 1.25, height: 210 }}>
            {analytics.charts.serviceBreakdown.length ? (
              <Doughnut data={serviceBreakdownData} options={doughnutOptions} />
            ) : (
              <EmptyChart label="No service breakdown available" />
            )}
          </Box>

          {analytics.charts.serviceBreakdown.length ? (
            <Stack spacing={0.9} sx={{ mt: 1 }}>
              {analytics.charts.serviceBreakdown.map((item, index) => {
                const total = analytics.charts.serviceBreakdown.reduce(
                  (sum, entry) => sum + entry.value,
                  0,
                );
                const percent = total
                  ? Math.round((item.value / total) * 100)
                  : 0;

                return (
                  <Stack
                    key={item.label}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Stack direction="row" spacing={0.8} alignItems="center">
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: serviceColors[index % serviceColors.length],
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: 12.5,
                          color: "#4B5563",
                          fontWeight: 500,
                        }}
                      >
                        {item.label}
                      </Typography>
                    </Stack>

                    <Typography
                      sx={{
                        fontSize: 12.5,
                        color: "#8C8C8C",
                        fontWeight: 600,
                      }}
                    >
                      {percent}%
                    </Typography>
                  </Stack>
                );
              })}
            </Stack>
          ) : null}
        </CardPanel>
      </Box>
    </Box>
  );
}

function MetricCard({ icon, label, value, deltaText, accent }) {
  return (
    <Card
      sx={{
        p: 2,
        borderRadius: 1,
        border: "1px solid #E9E1DB",
        boxShadow: "none",
        bgcolor: "#FFFFFF",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -16,
          right: -8,
          width: 92,
          height: 92,
          borderRadius: "50%",
          bgcolor: "rgba(0,0,0,0.03)",
        }}
      />

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Box>
          <Typography
            sx={{
              fontSize: 12,
              color: "#9CA3AF",
              fontWeight: 500,
            }}
          >
            {label}
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
            {value}
          </Typography>

          <Typography
            sx={{
              mt: 1.2,
              fontSize: 12,
              color: accent || "#22C55E",
              fontWeight: 600,
            }}
          >
            ↗ {deltaText}
          </Typography>
        </Box>

        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            bgcolor: "rgba(0,0,0,0.04)",
            display: "grid",
            placeItems: "center",
            zIndex: 1,
          }}
        >
          {icon}
        </Box>
      </Stack>
    </Card>
  );
}

function CardPanel({ title, subtitle, rightBadge, children }) {
  return (
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
            {title}
          </Typography>
          <Typography
            sx={{
              mt: 0.35,
              fontSize: 12.5,
              color: "#9CA3AF",
              fontWeight: 500,
            }}
          >
            {subtitle}
          </Typography>
        </Box>

        {rightBadge ? (
          <Box
            sx={{
              px: 1.1,
              py: 0.45,
              borderRadius: 1,
              bgcolor: "#EAFBF1",
              color: "#22C55E",
              fontSize: 11.5,
              fontWeight: 700,
            }}
          >
            {rightBadge}
          </Box>
        ) : null}
      </Stack>

      {children}
    </Card>
  );
}

function EmptyChart({ label }) {
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

function calculateAverageCompletionDays(projects) {
  if (!projects.length) return 0;

  const values = projects
    .map((project) => {
      const start = new Date(project.createdAt);
      const end = new Date(project.updatedAt || project.createdAt);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return null;
      }

      const diff = end.getTime() - start.getTime();
      return diff >= 0 ? diff / (1000 * 60 * 60 * 24) : null;
    })
    .filter((value) => value !== null);

  if (!values.length) return 0;

  return Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
}

function calculateApprovalScore(projects) {
  const submitted = projects.filter((p) =>
    ["Submitted", "Approved", "Completed", "Rejected"].includes(p.status),
  ).length;

  const approved = projects.filter((p) =>
    ["Approved", "Completed"].includes(p.status),
  ).length;

  if (!submitted) return 0;
  return Math.round((approved / submitted) * 100);
}
