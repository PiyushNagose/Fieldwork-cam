import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
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
  SearchOutlined,
  SupportAgentOutlined,
  PendingOutlined,
  CheckCircleOutlineOutlined,
  ReportProblemOutlined,
} from "@mui/icons-material";
import { getTicketsApi } from "../../api/support.api";

const STATUS_FILTERS = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"];

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError("");
      const params = statusFilter !== "ALL" ? { status: statusFilter } : {};
      const res = await getTicketsApi(params);
      const data = res?.data || res || [];
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load tickets",
      );
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tickets;
    return tickets.filter((item) =>
      [item.ticketId, item.vendorName, item.subject, item.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [tickets, search]);

  const stats = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter((t) => t.status === "OPEN").length,
      inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
      resolved: tickets.filter((t) => t.status === "RESOLVED").length,
    }),
    [tickets],
  );

  if (loading && tickets.length === 0) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: 400 }}
        spacing={2}
      >
        <CircularProgress />
        <Typography color="text.secondary">
          Loading support tickets...
        </Typography>
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        px: { xs: 1.5, md: 2 },
        py: { xs: 1.5, md: 2 },
        bgcolor: "#F8F5F2",
        minHeight: "100vh",
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
        Support
      </Typography>
      <Typography
        sx={{ mt: 0.5, color: "#9CA3AF", fontSize: 13, fontWeight: 500 }}
      >
        Manage vendor support tickets and communications.
      </Typography>

      {/* Metric Cards */}
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
          label="Total Tickets"
          value={stats.total}
          icon={
            <SupportAgentOutlined sx={{ fontSize: 18, color: "#7A7A7A" }} />
          }
          deltaText="All time requests"
          accent="#9CA3AF"
        />
        <MetricCard
          label="Open Tickets"
          value={stats.open}
          icon={
            <ReportProblemOutlined sx={{ fontSize: 18, color: "#EF4444" }} />
          }
          deltaText="Requires attention"
          accent="#EF4444"
        />
        <MetricCard
          label="In Progress"
          value={stats.inProgress}
          icon={<PendingOutlined sx={{ fontSize: 18, color: "#EAB308" }} />}
          deltaText="Currently being handled"
          accent="#EAB308"
        />
        <MetricCard
          label="Resolved"
          value={stats.resolved}
          icon={
            <CheckCircleOutlineOutlined
              sx={{ fontSize: 18, color: "#22C55E" }}
            />
          }
          deltaText="Successfully closed"
          accent="#22C55E"
        />
      </Box>

      {/* Filters Section */}
      <Box
        sx={{
          mt: 1.5,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.6fr auto" },
          gap: 1.25,
          alignItems: "center",
        }}
      >
        <OutlinedInput
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ID, vendor or subject..."
          startAdornment={
            <InputAdornment position="start">
              <SearchOutlined sx={{ color: "#B3ACA5", fontSize: 18 }} />
            </InputAdornment>
          }
          sx={{
            height: 40,
            bgcolor: "#FFFFFF",
            borderRadius: 1,
            fontSize: 13,
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E9E1DB" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#D7C8BC",
              borderWidth: "1px",
            },
          }}
        />
        <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.25 }}>
          {STATUS_FILTERS.map((item) => (
            <Button
              key={item}
              onClick={() => setStatusFilter(item)}
              variant="contained"
              disableElevation
              sx={{
                minWidth: 100,
                height: 40,
                borderRadius: 1,
                textTransform: "none",
                fontSize: 13,
                fontWeight: 700,
                bgcolor: statusFilter === item ? "#F1DED4" : "#FFFFFF",
                color: statusFilter === item ? "#5F5046" : "#8F8A84",
                border: "1px solid #E9E1DB",
                "&:hover": {
                  bgcolor: statusFilter === item ? "#EBD7CB" : "#F3EEEA",
                },
              }}
            >
              {item === "ALL" ? "All" : item.replace("_", " ")}
            </Button>
          ))}
        </Stack>
      </Box>

      {/* Main Table Panel */}
      <Box sx={{ mt: 1.5 }}>
        <CardPanel
          title="Ticket Overview"
          subtitle="Detailed list of all support requests"
        >
          {error ? (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 1 }}>
              {error}
            </Alert>
          ) : filteredTickets.length === 0 ? (
            <Box
              sx={{
                mt: 2,
                py: 8,
                border: "1px dashed #E5DED7",
                borderRadius: 1,
                textAlign: "center",
                bgcolor: "#FCFAF8",
              }}
            >
              <Typography sx={{ color: "#B0B5BE", fontSize: 13 }}>
                No tickets found matching your criteria
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ mt: 1.5 }}>
              <Table size="small">
                <TableHead>
                  <TableRow
                    sx={{
                      "& th": {
                        borderBottom: "1px solid #F2ECE6",
                        py: 1.5,
                        px: 1,
                        color: "#9CA3AF",
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                      },
                    }}
                  >
                    <TableCell>ID</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTickets.map((item, idx) => (
                    <TableRow
                      key={idx}
                      sx={{
                        "& td": {
                          borderBottom: "1px solid #F8F5F2",
                          py: 1.5,
                          px: 1,
                        },
                        "&:hover": { bgcolor: "#FCFAF8" },
                      }}
                    >
                      <TableCell
                        sx={{ fontWeight: 700, fontSize: 13, color: "#374151" }}
                      >
                        #{item.ticketId}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              fontSize: 10,
                              fontWeight: 700,
                              bgcolor: "#E9E1DB",
                              color: "#5F5046",
                            }}
                          >
                            {item.vendorName?.charAt(0)}
                          </Avatar>
                          <Typography
                            sx={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: "#1F2937",
                            }}
                          >
                            {item.vendorName}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            fontSize: 13,
                            color: "#4B5563",
                            maxWidth: 300,
                            noWrap: true,
                          }}
                        >
                          {item.subject}
                        </Typography>
                      </TableCell>
                      <TableCell>{priorityChip(item.priority)}</TableCell>
                      <TableCell>{statusChip(item.status)}</TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}
                      >
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardPanel>
      </Box>
    </Box>
  );
}

// --- HELPER COMPONENTS ---

// --- HELPER COMPONENTS (IDENTICAL STRUCTURE TO ANALYTICS) ---

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
          <Typography sx={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>
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
            {deltaText}
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

function CardPanel({ title, subtitle, children }) {
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
          sx={{ mt: 0.35, fontSize: 12.5, color: "#9CA3AF", fontWeight: 500 }}
        >
          {subtitle}
        </Typography>
      </Box>
      {children}
    </Card>
  );
}

const statusChip = (status = "") => {
  const map = {
    OPEN: { bg: "#FDEBEC", color: "#EF4444", label: "Open" },
    IN_PROGRESS: { bg: "#FFF5DD", color: "#EAB308", label: "In Progress" },
    RESOLVED: { bg: "#EAFBF1", color: "#22C55E", label: "Resolved" },
  };
  const config = map[status] || {
    bg: "#F3F4F6",
    color: "#6B7280",
    label: status,
  };
  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        bgcolor: config.bg,
        color: config.color,
        fontWeight: 700,
        fontSize: 10,
        borderRadius: 1,
        height: 20,
        textTransform: "uppercase",
      }}
    />
  );
};

const priorityChip = (priority = "") => {
  const val = String(priority).toUpperCase();
  const color =
    val === "HIGH" || val === "URGENT"
      ? "#EF4444"
      : val === "MEDIUM"
        ? "#EAB308"
        : "#9CA3AF";
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: color }} />
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#4B5563" }}>
        {priority}
      </Typography>
    </Stack>
  );
};
