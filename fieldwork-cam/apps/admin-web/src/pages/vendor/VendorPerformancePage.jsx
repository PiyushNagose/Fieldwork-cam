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
  AutoGraphOutlined,
  CheckCircleOutlineOutlined,
  ScheduleOutlined,
  TrendingUpOutlined,
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
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { getProjectsApi } from "../../api/project.api";
import { getStaffApi } from "../../api/staff.api";
import { useAuth } from "../../auth/AuthContext";

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

const MONTHS_TO_SHOW = 10;

export default function VendorPerformancePage() {
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setLoading(true);
        setError("");

        if (!user?.authUserId) {
          setProjects([]);
          setStaff([]);
          return;
        }

        const [projectsRes, staffRes] = await Promise.all([
          getProjectsApi(),
          getStaffApi(),
        ]);

        const allProjects = projectsRes?.data || projectsRes || [];
        const allStaff = staffRes?.data || staffRes || [];

        setProjects(
          (Array.isArray(allProjects) ? allProjects : []).filter(
            (item) => item.assignedVendorAuthUserId === user.authUserId,
          ),
        );
        setStaff(Array.isArray(allStaff) ? allStaff : []);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            "Failed to load performance analytics",
        );
        setProjects([]);
        setStaff([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [user?.authUserId]);

  const analytics = useMemo(() => {
    const monthKeys = getRecentMonthKeys(MONTHS_TO_SHOW);
    const completedProjects = projects.filter((item) =>
      ["Completed", "Approved"].includes(item.status),
    );
    const submittedProjects = projects.filter((item) =>
      ["Submitted", "Approved", "Completed", "Rejected"].includes(item.status),
    );
    const rejectedProjects = projects.filter((item) => item.status === "Rejected");

    const activeProjects = projects.filter((item) =>
      ["New", "In Progress", "Submitted"].includes(item.status),
    ).length;

    const avgCompletionDays = calculateAverageCompletionDays(completedProjects);
    const approvalScore = calculateApprovalScore(projects);

    const monthlyCompletion = monthKeys.map((monthKey) =>
      projects.filter(
        (item) =>
          monthFromDate(item.updatedAt || item.createdAt) === monthKey &&
          ["Completed", "Approved"].includes(item.status),
      ).length,
    );

    const approvalRateTrend = monthKeys.map((monthKey) => {
      const monthSubmitted = submittedProjects.filter(
        (item) => monthFromDate(item.updatedAt || item.createdAt) === monthKey,
      );
      const monthApproved = monthSubmitted.filter((item) =>
        ["Approved", "Completed"].includes(item.status),
      );
      return monthSubmitted.length
        ? Math.round((monthApproved.length / monthSubmitted.length) * 100)
        : 0;
    });

    const workTypeMap = {};
    projects.forEach((item) => {
      const key = item.serviceType || "Other";
      workTypeMap[key] = (workTypeMap[key] || 0) + 1;
    });

    const workTypes = Object.entries(workTypeMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    const rejectionMap = {};
    rejectedProjects.forEach((item) => {
      const key =
        item.rejectionReason ||
        item.rejectReason ||
        item.retakeReason ||
        "Needs Review";
      rejectionMap[key] = (rejectionMap[key] || 0) + 1;
    });

    const rejectionReasons = Object.entries(rejectionMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const staffPerformance = staff
      .map((member) => ({
        ...member,
        productivity: member.assignedProjectIds?.length
          ? Math.min(
              100,
              Math.round(
                ((Number(member.completedJobs || 0) || 0) /
                  Math.max(member.assignedProjectIds.length, 1)) *
                  100,
              ),
            )
          : 0,
      }))
      .sort((a, b) => {
        const scoreA = Number(a.completedJobs || 0) * 10 + Number(a.rating || 0);
        const scoreB = Number(b.completedJobs || 0) * 10 + Number(b.rating || 0);
        return scoreB - scoreA;
      });

    const milestones = [
      {
        label: "Projects Completed",
        value: completedProjects.length,
      },
      {
        label: "Projects Submitted",
        value: projects.filter((item) => item.status === "Submitted").length,
      },
      {
        label: "Approval Score",
        value: `${approvalScore}%`,
      },
      {
        label: "Avg Completion Time",
        value: avgCompletionDays > 0 ? `${avgCompletionDays} days` : "N/A",
      },
    ];

    return {
      totalProjects: projects.length,
      activeProjects,
      approvalScore,
      avgCompletionDays,
      completedProjects: completedProjects.length,
      monthlyCompletion,
      approvalRateTrend,
      monthLabels: monthKeys.map(formatMonthKey),
      staffPerformance,
      workTypes,
      rejectionReasons,
      milestones,
    };
  }, [projects, staff]);

  const completionBarData = {
    labels: analytics.monthLabels,
    datasets: [
      {
        label: "Completion",
        data: analytics.monthlyCompletion,
        backgroundColor: "#FB7185",
        borderRadius: 5,
        barThickness: 20,
      },
    ],
  };

  const approvalLineData = {
    labels: analytics.monthLabels,
    datasets: [
      {
        label: "Approval",
        data: analytics.approvalRateTrend,
        borderColor: "#8B5CF6",
        backgroundColor: "rgba(139,92,246,0.08)",
        tension: 0.42,
        fill: true,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  const smallLineData = {
    labels: analytics.monthLabels,
    datasets: [
      {
        data: analytics.monthlyCompletion,
        borderColor: "#32B3C6",
        backgroundColor: "rgba(50,179,198,0.10)",
        tension: 0.42,
        fill: true,
        pointRadius: 0,
        borderWidth: 1.8,
      },
    ],
  };

  const doughnutData = {
    labels: ["Approved", "Pending"],
    datasets: [
      {
        data: [analytics.approvalScore, Math.max(100 - analytics.approvalScore, 0)],
        backgroundColor: ["#8B5CF6", "#F2ECE6"],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
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
        grid: { color: "#F2ECE6" },
        border: { display: false },
        ticks: { color: "#9CA3AF", font: { size: 11 } },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: { display: false },
    },
  };

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
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1.5}
      >
        <Box>
          <Typography
            sx={{
              fontSize: 28,
              fontWeight: 700,
              color: "#1F2937",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            Performance Analytics
          </Typography>
          <Typography
            sx={{ mt: 0.5, color: "#9CA3AF", fontSize: 13, fontWeight: 500 }}
          >
            Monitor delivery quality, speed, and staff performance.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          sx={{
            minHeight: 30,
            px: 1.25,
            borderRadius: 1,
            borderColor: "#E8E1DA",
            color: "#8D8781",
            bgcolor: "#FFFFFF",
            fontSize: 11.5,
            fontWeight: 600,
            textTransform: "none",
          }}
        >
          This Year
        </Button>
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mt: 1.5, borderRadius: 1 }}>
          {error}
        </Alert>
      ) : null}

      <Box
        sx={{
          mt: 1.5,
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
          icon={<AutoGraphOutlined sx={{ fontSize: 18 }} />}
          label="Projects Tracked"
          value={analytics.totalProjects}
          helper={`${analytics.activeProjects} active now`}
          accent="#10B981"
        />
        <MetricCard
          icon={<CheckCircleOutlineOutlined sx={{ fontSize: 18 }} />}
          label="Completed"
          value={analytics.completedProjects}
          helper={`${analytics.completedProjects} done`}
          accent="#FB7185"
        />
        <MetricCard
          icon={<TrendingUpOutlined sx={{ fontSize: 18 }} />}
          label="Success Rate"
          value={`${analytics.approvalScore}%`}
          helper="approved vs submitted"
          accent="#8B5CF6"
        />
        <MetricCard
          icon={<ScheduleOutlined sx={{ fontSize: 18 }} />}
          label="Avg. Completion Time"
          value={
            analytics.avgCompletionDays > 0
              ? `${analytics.avgCompletionDays}d`
              : "N/A"
          }
          helper="from creation to completion"
          accent="#32B3C6"
        />
      </Box>

      <SectionCard title="Monthly Project Completion">
        <Box sx={{ mt: 1.5, height: 220 }}>
          {analytics.monthlyCompletion.some((item) => item > 0) ? (
            <Bar data={completionBarData} options={{ ...chartOptions, plugins: { legend: { display: false } } }} />
          ) : (
            <EmptyChart label="No completion data available" />
          )}
        </Box>
      </SectionCard>

      <SectionCard title="Approval Rate Trend">
        <Box sx={{ mt: 1.5, height: 220 }}>
          {analytics.approvalRateTrend.some((item) => item > 0) ? (
            <Line data={approvalLineData} options={chartOptions} />
          ) : (
            <EmptyChart label="No approval trend available" />
          )}
        </Box>
      </SectionCard>

      <Box
        sx={{
          mt: 1.5,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "0.95fr 0.95fr 1.1fr" },
          gap: 1.5,
          alignItems: "stretch",
        }}
      >
        <SectionCard title="Completion Time">
          <Box sx={{ mt: 1.25, height: 180 }}>
            {analytics.monthlyCompletion.some((item) => item > 0) ? (
              <Line
                data={smallLineData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: {
                      grid: { display: false },
                      border: { display: false },
                      ticks: { color: "#9CA3AF", font: { size: 10 } },
                    },
                    y: {
                      grid: { color: "#F2ECE6" },
                      border: { display: false },
                      ticks: { color: "#9CA3AF", font: { size: 10 } },
                    },
                  },
                }}
              />
            ) : (
              <EmptyChart label="No completion time data" />
            )}
          </Box>
        </SectionCard>

        <SectionCard title="Success Score">
          <Box sx={{ mt: 1.2, height: 180, position: "relative" }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
              }}
            >
              <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#1F2937" }}>
                {analytics.approvalScore}%
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: "#9CA3AF", fontWeight: 600 }}>
                Approved
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              mt: -0.2,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1,
            }}
          >
            <MiniValueCard
              label="Projects"
              value={analytics.totalProjects}
              bg="#EEF2FF"
              color="#4F46E5"
            />
            <MiniValueCard
              label="Avg Time"
              value={
                analytics.avgCompletionDays > 0
                  ? `${analytics.avgCompletionDays}d`
                  : "N/A"
              }
              bg="#ECFEFF"
              color="#0891B2"
            />
          </Box>
        </SectionCard>

        <SectionCard title="Work Types">
          <Stack spacing={0.9} sx={{ mt: 1.2 }}>
            {analytics.workTypes.length ? (
              analytics.workTypes.slice(0, 6).map((item, index) => {
                const total = analytics.workTypes.reduce(
                  (sum, entry) => sum + entry.value,
                  0,
                );
                const percent = total ? Math.round((item.value / total) * 100) : 0;
                const colors = [
                  "#8B5CF6",
                  "#6366F1",
                  "#3B82F6",
                  "#FB7185",
                  "#F59E0B",
                  "#10B981",
                ];

                return (
                  <Box key={item.label}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography
                        sx={{ fontSize: 12.5, color: "#374151", fontWeight: 600 }}
                      >
                        {item.label}
                      </Typography>
                      <Typography
                        sx={{ fontSize: 11.5, color: "#9CA3AF", fontWeight: 600 }}
                      >
                        {item.value} / {percent}%
                      </Typography>
                    </Stack>
                    <Box
                      sx={{
                        mt: 0.45,
                        height: 5,
                        borderRadius: 999,
                        bgcolor: "#F2ECE6",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          width: `${percent}%`,
                          height: "100%",
                          bgcolor: colors[index % colors.length],
                          borderRadius: 999,
                        }}
                      />
                    </Box>
                  </Box>
                );
              })
            ) : (
              <EmptyChart label="No work type data available" />
            )}
          </Stack>
        </SectionCard>
      </Box>

      <SectionCard
        title="Staff Performance"
        rightText={`${analytics.staffPerformance.length} members`}
      >
        <Stack spacing={0.9} sx={{ mt: 1.2 }}>
          {analytics.staffPerformance.length ? (
            analytics.staffPerformance.map((member, index) => (
              <Stack
                key={member.authUserId}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  px: 1.1,
                  py: 0.95,
                  borderRadius: 1,
                  border: "1px solid #EEE7E2",
                  bgcolor: "#FFFFFF",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      width: 18,
                      textAlign: "center",
                      fontSize: 11,
                      color: "#B0B5BE",
                      fontWeight: 700,
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Avatar
                    src={member.profilePhotoUrl || ""}
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
                    {member.fullName?.charAt(0) || "S"}
                  </Avatar>
                  <Box>
                    <Typography
                      sx={{ fontSize: 12.5, fontWeight: 700, color: "#1F2937" }}
                    >
                      {member.fullName || "Unnamed Staff"}
                    </Typography>
                    <Typography
                      sx={{ fontSize: 11.5, color: "#9CA3AF", fontWeight: 500 }}
                    >
                      {member.roleTitle || "Field Photographer"}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={2.2} alignItems="center">
                  <MetricText label="Done" value={member.completedJobs || 0} />
                  <MetricText label="Rate" value={formatRating(member.rating)} />
                  <MetricText label="Load" value={`${member.productivity}%`} />
                </Stack>
              </Stack>
            ))
          ) : (
            <EmptyChart label="No staff performance data available" />
          )}
        </Stack>
      </SectionCard>

      <SectionCard title="Top Rejection Reasons">
        <Stack spacing={1.05} sx={{ mt: 1.2 }}>
          {analytics.rejectionReasons.length ? (
            analytics.rejectionReasons.map((item, index) => {
              const total = analytics.rejectionReasons.reduce(
                (sum, entry) => sum + entry.value,
                0,
              );
              const percent = total ? Math.round((item.value / total) * 100) : 0;
              const colors = ["#EF4444", "#F97316", "#F59E0B", "#EAB308", "#A16207"];
              return (
                <Box key={item.label}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography
                      sx={{ fontSize: 12.5, color: "#374151", fontWeight: 600 }}
                    >
                      {item.label}
                    </Typography>
                    <Typography
                      sx={{ fontSize: 11.5, color: "#9CA3AF", fontWeight: 600 }}
                    >
                      {item.value}
                    </Typography>
                  </Stack>
                  <Box
                    sx={{
                      mt: 0.5,
                      height: 4,
                      borderRadius: 999,
                      bgcolor: "#F2ECE6",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        width: `${percent}%`,
                        height: "100%",
                        borderRadius: 999,
                        bgcolor: colors[index % colors.length],
                      }}
                    />
                  </Box>
                </Box>
              );
            })
          ) : (
            <EmptyChart label="No rejection data available" />
          )}
        </Stack>
      </SectionCard>

      <SectionCard title="Milestones">
        <Stack spacing={1} sx={{ mt: 1.2 }}>
          {analytics.milestones.map((item, index) => (
            <Stack
              key={item.label}
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                px: 1.15,
                py: 1,
                borderRadius: 1,
                bgcolor: index < 2 ? "#F1FCF7" : "#FCFAF8",
                border: "1px solid #E8EEE9",
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  bgcolor: index < 2 ? "#E4FAEE" : "#F3F4F6",
                  color: index < 2 ? "#10B981" : "#9CA3AF",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <CheckCircleOutlineOutlined sx={{ fontSize: 15 }} />
              </Box>
              <Box>
                <Typography
                  sx={{ fontSize: 12.5, color: "#374151", fontWeight: 700 }}
                >
                  {item.value}
                </Typography>
                <Typography
                  sx={{ fontSize: 11.5, color: "#9CA3AF", fontWeight: 500 }}
                >
                  {item.label}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </SectionCard>
    </Box>
  );
}

function MetricCard({ icon, label, value, helper, accent }) {
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
          right: -12,
          bottom: -16,
          width: 80,
          height: 80,
          borderRadius: "50%",
          bgcolor: `${accent}12`,
        }}
      />

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1,
            bgcolor: accent,
            color: "#FFFFFF",
            display: "grid",
            placeItems: "center",
          }}
        >
          {icon}
        </Box>
        <Typography sx={{ fontSize: 11, color: accent, fontWeight: 600 }}>
          {helper}
        </Typography>
      </Stack>

      <Typography
        sx={{
          mt: 2,
          fontSize: 28,
          fontWeight: 700,
          color: "#1F2937",
          lineHeight: 1.1,
        }}
      >
        {value}
      </Typography>
      <Typography sx={{ mt: 0.45, fontSize: 12.5, color: "#9CA3AF", fontWeight: 500 }}>
        {label}
      </Typography>
    </Card>
  );
}

function SectionCard({ title, rightText, children }) {
  return (
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
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1F2937" }}>
          {title}
        </Typography>
        {rightText ? (
          <Typography sx={{ fontSize: 11.5, color: "#9CA3AF", fontWeight: 600 }}>
            {rightText}
          </Typography>
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
        minHeight: 120,
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

function MiniValueCard({ label, value, bg, color }) {
  return (
    <Box
      sx={{
        borderRadius: 1,
        bgcolor: bg,
        px: 1,
        py: 0.9,
      }}
    >
      <Typography sx={{ fontSize: 14, fontWeight: 700, color, textAlign: "center" }}>
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

function MetricText({ label, value }) {
  return (
    <Box sx={{ textAlign: "center", minWidth: 50 }}>
      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#1F2937" }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: 10.5, color: "#B0B5BE", fontWeight: 700 }}>
        {label}
      </Typography>
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
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
      const diff = end.getTime() - start.getTime();
      return diff >= 0 ? diff / (1000 * 60 * 60 * 24) : null;
    })
    .filter((value) => value !== null);

  if (!values.length) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
}

function calculateApprovalScore(projects) {
  const submitted = projects.filter((item) =>
    ["Submitted", "Approved", "Completed", "Rejected"].includes(item.status),
  ).length;
  const approved = projects.filter((item) =>
    ["Approved", "Completed"].includes(item.status),
  ).length;

  if (!submitted) return 0;
  return Math.round((approved / submitted) * 100);
}

function formatRating(value) {
  const amount = Number(value || 0);
  return amount > 0 ? amount.toFixed(1) : "0.0";
}
