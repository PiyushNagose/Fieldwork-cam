import React, { useEffect, useMemo, useState } from "react";
import { Box, Card, CircularProgress, Stack, Typography } from "@mui/material";
import {
  FolderOutlined,
  HourglassEmptyOutlined,
  SendOutlined,
  CheckCircleOutlined,
} from "@mui/icons-material";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
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
  Filler,
);

export default function VendorDashboardPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [pRes, iRes] = await Promise.all([
          getProjectsApi(),
          getInvoicesApi(),
        ]);

        const allProjects = pRes?.data || pRes || [];
        const allInvoices = iRes?.data || iRes || [];

        setProjects(
          allProjects.filter(
            (p) => p.assignedVendorAuthUserId === user?.authUserId,
          ),
        );

        setInvoices(
          allInvoices.filter((i) => i.vendorAuthUserId === user?.authUserId),
        );
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  // 🔷 KPI STATS
  const stats = useMemo(() => {
    return {
      new: projects.filter((p) => p.status === "New").length,
      progress: projects.filter((p) => p.status === "In Progress").length,
      submitted: projects.filter((p) => p.status === "Submitted").length,
      completed: projects.filter((p) =>
        ["Completed", "Approved"].includes(p.status),
      ).length,
    };
  }, [projects]);

  const cards = [
    {
      label: "New Projects",
      value: stats.new,
      icon: <FolderOutlined sx={{ fontSize: 18 }} />,
    },
    {
      label: "In Progress",
      value: stats.progress,
      icon: <HourglassEmptyOutlined sx={{ fontSize: 18 }} />,
    },
    {
      label: "Submitted",
      value: stats.submitted,
      icon: <SendOutlined sx={{ fontSize: 18 }} />,
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: <CheckCircleOutlined sx={{ fontSize: 18 }} />,
    },
  ];

  // 🔷 CHART DATA (EMPTY SAFE)
  const earningsSeries = useMemo(() => {
    const months = getRecentMonths(6);

    return months.map((m) => {
      const value = invoices
        .filter(
          (i) => normalize(i.status) === "PAID" && monthKey(i.createdAt) === m,
        )
        .reduce((sum, i) => sum + Number(i.amount || 0), 0);

      return { label: formatMonth(m), value };
    });
  }, [invoices]);

  const chartData = {
    labels: earningsSeries.map((i) => i.label),
    datasets: [
      {
        label: "Earnings",
        data: earningsSeries.map((i) => i.value),
        borderColor: "#8C7A70",
        backgroundColor: "rgba(203,184,173,0.15)",
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
      y: {
        grid: { color: "#F2ECE6" },
        ticks: { font: { size: 11 } },
      },
    },
  };

  const recentProjects = projects.slice(0, 5);

  if (loading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: 320 }}
      >
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Box>
      {/* HEADER */}
      <Typography sx={{ fontSize: 28, fontWeight: 700, color: "#1F2937" }}>
        Dashboard
      </Typography>

      <Typography sx={{ mt: 0.5, fontSize: 13, color: "#9CA3AF" }}>
        Welcome back. Here's your overview.
      </Typography>

      {/* KPI CARDS */}
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
        {cards.map((c) => (
          <Card
            key={c.label}
            sx={{
              p: 2,
              border: "1px solid #E9E1DB",
              borderRadius: 1,
              bgcolor: "#FFFFFF",
            }}
          >
            <Stack direction="row" justifyContent="space-between">
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1,
                  bgcolor: "#F3F4F6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {c.icon}
              </Box>
            </Stack>

            <Typography sx={{ mt: 1, fontSize: 22, fontWeight: 700 }}>
              {c.value}
            </Typography>

            <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>
              {c.label}
            </Typography>
          </Card>
        ))}
      </Box>

      {/* CHART */}
      <Card
        sx={{
          mt: 1.5,
          p: 2,
          border: "1px solid #E9E1DB",
          borderRadius: 1,
          bgcolor: "#FFFFFF",
        }}
      >
        <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
          Earnings Overview
        </Typography>

        <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>
          Monthly revenue trend
        </Typography>

        <Box sx={{ height: 260, mt: 1.5 }}>
          {earningsSeries.length ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <EmptyState />
          )}
        </Box>
      </Card>

      {/* RECENT PROJECTS */}
      <Card
        sx={{
          mt: 1.5,
          p: 2,
          border: "1px solid #E9E1DB",
          borderRadius: 1,
        }}
      >
        <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
          Recent Projects
        </Typography>

        <Stack spacing={1.5} sx={{ mt: 1.5 }}>
          {recentProjects.length ? (
            recentProjects.map((p, i) => (
              <Box key={i}>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                  {p.title || "Untitled Project"}
                </Typography>

                <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>
                  {p.location || "—"} • {p.createdAt || ""}
                </Typography>

                <Box
                  sx={{
                    mt: 0.5,
                    height: 6,
                    bgcolor: "#F1EBE6",
                    borderRadius: 3,
                  }}
                >
                  <Box
                    sx={{
                      width: `${p.progress || 0}%`,
                      height: "100%",
                      bgcolor: "#8C7A70",
                      borderRadius: 3,
                    }}
                  />
                </Box>
              </Box>
            ))
          ) : (
            <EmptyState />
          )}
        </Stack>
      </Card>
    </Box>
  );
}

/* helpers */

function EmptyState() {
  return (
    <Box
      sx={{
        height: 120,
        border: "1px dashed #E5DED7",
        borderRadius: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        color: "#B0B5BE",
      }}
    >
      No data available
    </Box>
  );
}

function normalize(s) {
  return String(s || "").toUpperCase();
}

function getRecentMonths(n) {
  const arr = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    arr.push(`${d.getFullYear()}-${d.getMonth() + 1}`);
  }
  return arr;
}

function monthKey(d) {
  if (!d) return "";
  const date = new Date(d);
  return `${date.getFullYear()}-${date.getMonth() + 1}`;
}

function formatMonth(k) {
  const [y, m] = k.split("-");
  return new Date(y, m - 1).toLocaleString("en-US", { month: "short" });
}
