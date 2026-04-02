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
  AutoGraphOutlined,
  CheckCircleOutlined,
  FolderOutlined,
  HourglassEmptyOutlined,
  SendOutlined,
} from "@mui/icons-material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { getProjectsApi } from "../../api/project.api";
import { getInvoicesApi } from "../../api/invoice.api";
import { useAuth } from "../../auth/AuthContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);

export default function VendorDashboardPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        if (!user?.authUserId) {
          setProjects([]);
          setInvoices([]);
          return;
        }

        const [projectsRes, invoicesRes] = await Promise.all([
          getProjectsApi(),
          getInvoicesApi({ vendorAuthUserId: user.authUserId }),
        ]);

        const allProjects = projectsRes?.data || projectsRes || [];
        const allInvoices = invoicesRes?.data || invoicesRes || [];

        setProjects(
          (Array.isArray(allProjects) ? allProjects : []).filter(
            (item) => item.assignedVendorAuthUserId === user.authUserId,
          ),
        );
        setInvoices(Array.isArray(allInvoices) ? allInvoices : []);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            "Failed to load dashboard",
        );
        setProjects([]);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.authUserId]);

  const stats = useMemo(() => {
    const newProjects = projects.filter((item) => item.status === "New").length;
    const inProgress = projects.filter((item) => item.status === "In Progress").length;
    const submitted = projects.filter((item) => item.status === "Submitted").length;
    const completed = projects.filter((item) =>
      ["Completed", "Approved"].includes(item.status),
    ).length;

    return { newProjects, inProgress, submitted, completed };
  }, [projects]);

  const monthlySeries = useMemo(() => {
    const monthKeys = getRecentMonthKeys(9);

    return monthKeys.map((monthKey) => {
      const earnings = invoices
        .filter(
          (item) =>
            String(item.status || "").toUpperCase() === "PAID" &&
            monthFromDate(item.paymentDate || item.createdAt) === monthKey,
        )
        .reduce((sum, item) => sum + Number(item.amount || item.totalDue || 0), 0);

      const projectCount = projects.filter(
        (item) => monthFromDate(item.createdAt) === monthKey,
      ).length;

      return {
        label: formatMonthKey(monthKey),
        earnings,
        projects: projectCount,
      };
    });
  }, [invoices, projects]);

  const chartData = {
    labels: monthlySeries.map((item) => item.label),
    datasets: [
      {
        label: "Earnings",
        data: monthlySeries.map((item) => item.earnings),
        borderColor: "#1DA1F2",
        backgroundColor: "rgba(29,161,242,0.10)",
        fill: true,
        tension: 0.42,
        pointRadius: 0,
        borderWidth: 2,
        yAxisID: "y",
      },
      {
        label: "Projects",
        data: monthlySeries.map((item) => item.projects),
        borderColor: "#8B5CF6",
        backgroundColor: "rgba(139,92,246,0.06)",
        fill: false,
        tension: 0.42,
        pointRadius: 0,
        borderWidth: 2,
        yAxisID: "y1",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          boxWidth: 8,
          usePointStyle: true,
          pointStyle: "circle",
          font: { size: 11 },
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
        position: "left",
        grid: { color: "#F2ECE6" },
        border: { display: false },
        ticks: {
          color: "#9CA3AF",
          font: { size: 11 },
          callback: (value) => formatCompactCurrency(Number(value || 0)),
        },
      },
      y1: {
        position: "right",
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: "#C4B5FD",
          font: { size: 10 },
        },
      },
    },
  };

  const recentProjects = useMemo(
    () =>
      [...projects]
        .sort(
          (a, b) =>
            new Date(b.createdAt || b.updatedAt).getTime() -
            new Date(a.createdAt || a.updatedAt).getTime(),
        )
        .slice(0, 5),
    [projects],
  );

  const cards = [
    {
      label: "New Projects",
      value: stats.newProjects,
      helper: "+4 this week",
      accent: "#2EA8FF",
      icon: <FolderOutlined sx={{ fontSize: 18 }} />,
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      helper: "+2 this week",
      accent: "#F59E0B",
      icon: <HourglassEmptyOutlined sx={{ fontSize: 18 }} />,
    },
    {
      label: "Submitted",
      value: stats.submitted,
      helper: "-1 this week",
      accent: "#A855F7",
      icon: <SendOutlined sx={{ fontSize: 18 }} />,
    },
    {
      label: "Completed",
      value: stats.completed,
      helper: "+7 this month",
      accent: "#10B981",
      icon: <CheckCircleOutlined sx={{ fontSize: 18 }} />,
    },
  ];

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 320 }}>
        <CircularProgress />
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
        Welcome back. Here&apos;s your overview.
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ mt: 1.5, borderRadius: 1 }}>
          {error}
        </Alert>
      ) : null}

      <Box
        sx={{
          mt: 2.1,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 1.5,
        }}
      >
        {cards.map((item) => (
          <DashboardMetricCard key={item.label} item={item} />
        ))}
      </Box>

      <Card
        sx={{
          mt: 1.5,
          p: 2,
          borderRadius: 1,
          border: "1px solid #E9E1DB",
          boxShadow: "none",
          bgcolor: "#FFFFFF",
        }}
      >
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1F2937" }}>
          Earnings Overview
        </Typography>
        <Typography
          sx={{ mt: 0.35, fontSize: 12.5, color: "#9CA3AF", fontWeight: 500 }}
        >
          Monthly revenue trend
        </Typography>

        <Box sx={{ mt: 1.4, height: 270 }}>
          {monthlySeries.some((item) => item.earnings > 0 || item.projects > 0) ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <EmptyState label="No earnings data available yet" />
          )}
        </Box>
      </Card>

      <Card
        sx={{
          mt: 1.5,
          p: 2,
          borderRadius: 1,
          border: "1px solid #E9E1DB",
          boxShadow: "none",
          bgcolor: "#FFFFFF",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1F2937" }}>
              Recent Projects
            </Typography>
            <Typography
              sx={{
                mt: 0.35,
                fontSize: 12.5,
                color: "#9CA3AF",
                fontWeight: 500,
              }}
            >
              Latest field assignments
            </Typography>
          </Box>

          <Typography
            sx={{ fontSize: 11.5, color: "#6366F1", fontWeight: 700 }}
          >
            View All
          </Typography>
        </Stack>

        <Stack spacing={1.3} sx={{ mt: 1.45 }}>
          {recentProjects.length ? (
            recentProjects.map((project) => (
              <RecentProjectRow key={project._id || project.id} project={project} />
            ))
          ) : (
            <EmptyState label="No recent projects found" compact />
          )}
        </Stack>
      </Card>
    </Box>
  );
}

function DashboardMetricCard({ item }) {
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
          right: 16,
          bottom: -18,
          width: 92,
          height: 92,
          borderRadius: "50%",
          bgcolor: `${item.accent}12`,
        }}
      />

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1,
            bgcolor: item.accent,
            color: "#FFFFFF",
            display: "grid",
            placeItems: "center",
          }}
        >
          {item.icon}
        </Box>

        <Typography sx={{ fontSize: 11, color: item.accent, fontWeight: 600 }}>
          {item.helper}
        </Typography>
      </Stack>

      <Typography
        sx={{
          mt: 2,
          fontSize: 33,
          fontWeight: 700,
          color: "#1F2937",
          lineHeight: 1.05,
        }}
      >
        {item.value}
      </Typography>
      <Typography sx={{ mt: 0.45, fontSize: 12.5, color: "#9CA3AF", fontWeight: 500 }}>
        {item.label}
      </Typography>
    </Card>
  );
}

function RecentProjectRow({ project }) {
  const progress = Number(project.progress || 0);
  const status = statusStyle(project.status);

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      spacing={2}
      sx={{
        py: 0.7,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={0.7} alignItems="center" sx={{ flexWrap: "wrap" }}>
          <Typography sx={{ fontSize: 10.5, color: "#6366F1", fontWeight: 700 }}>
            {project.workOrderNumber || "PRJ"}
          </Typography>
          <Typography sx={{ fontSize: 10.5, color: status.color, fontWeight: 700 }}>
            {status.label}
          </Typography>
        </Stack>

        <Typography
          sx={{
            mt: 0.45,
            fontSize: 13.5,
            fontWeight: 700,
            color: "#1F2937",
            lineHeight: 1.25,
          }}
        >
          {project.title || project.address || "Untitled Project"}
        </Typography>

        <Typography
          sx={{ mt: 0.35, fontSize: 11.5, color: "#9CA3AF", fontWeight: 500 }}
        >
          {shortLocation(project.address)} • {formatDate(project.dueDate || project.createdAt)}
        </Typography>
      </Box>

      <Box sx={{ width: 112 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography sx={{ fontSize: 10.5, color: "#B0B5BE", fontWeight: 600 }}>
            Progress
          </Typography>
          <Typography sx={{ fontSize: 10.5, color: "#6B7280", fontWeight: 700 }}>
            {progress}%
          </Typography>
        </Stack>
        <Box
          sx={{
            mt: 0.45,
            height: 4,
            borderRadius: 999,
            bgcolor: "#F1EBE6",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              width: `${progress}%`,
              height: "100%",
              borderRadius: 999,
              bgcolor: status.progressColor,
            }}
          />
        </Box>
      </Box>
    </Stack>
  );
}

function EmptyState({ label, compact = false }) {
  return (
    <Box
      sx={{
        minHeight: compact ? 120 : 180,
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

function statusStyle(status = "") {
  if (status === "In Progress") {
    return { label: "In Progress", color: "#F59E0B", progressColor: "#F59E0B" };
  }
  if (status === "Submitted") {
    return { label: "Submitted", color: "#A855F7", progressColor: "#A855F7" };
  }
  if (["Completed", "Approved"].includes(status)) {
    return { label: "Completed", color: "#10B981", progressColor: "#10B981" };
  }
  return { label: "New", color: "#2EA8FF", progressColor: "#2EA8FF" };
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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthKey(key) {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("en-US", { month: "short" });
}

function formatCompactCurrency(value) {
  const amount = Number(value || 0);
  if (!amount) return "$0";
  if (amount >= 1000) return `$${amount / 1000}k`;
  return `$${Math.round(amount)}`;
}

function shortLocation(address = "") {
  if (!address) return "No location";
  const parts = address
    .split(",")
    .map((item) => item.trim())
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
