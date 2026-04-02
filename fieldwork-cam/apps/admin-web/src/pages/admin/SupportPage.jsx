import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  AccessTimeOutlined,
  CheckCircleOutlineOutlined,
  PendingOutlined,
  ReportProblemOutlined,
  SearchOutlined,
  SupportAgentOutlined,
} from "@mui/icons-material";
import { getTicketsApi } from "../../api/support.api";
import { getVendorsApi } from "../../api/vendor.api";

const STATUS_FILTERS = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const formatStatusLabel = (value = "") =>
  String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatRelativeTime = (value) => {
  if (!value) return "just now";

  const now = Date.now();
  const date = new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.round((now - date) / 60000));

  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffMinutes < 1440) return `${Math.round(diffMinutes / 60)} hr ago`;
  return `${Math.round(diffMinutes / 1440)} day${Math.round(diffMinutes / 1440) > 1 ? "s" : ""} ago`;
};

const getInitials = (value = "") =>
  String(value)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

const getVendorAvatarTone = (name = "") => {
  const tones = [
    { bg: "#E59C81", color: "#FFF7F2" },
    { bg: "#6F90E7", color: "#F7FAFF" },
    { bg: "#8D73E6", color: "#FAF8FF" },
    { bg: "#E3AC12", color: "#FFFBEF" },
    { bg: "#2DBF74", color: "#F4FFF9" },
    { bg: "#9A9087", color: "#FBF8F5" },
  ];

  const seed = String(name || "")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return tones[seed % tones.length];
};

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchSupportData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const ticketParams = statusFilter !== "ALL" ? { status: statusFilter } : {};

      const [ticketsResponse, vendorsResponse] = await Promise.all([
        getTicketsApi(ticketParams),
        getVendorsApi(),
      ]);

      const ticketData = ticketsResponse?.data || ticketsResponse || [];
      const vendorData = vendorsResponse?.data || vendorsResponse || [];

      setTickets(Array.isArray(ticketData) ? ticketData : []);
      setVendors(Array.isArray(vendorData) ? vendorData : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load support tickets",
      );
      setTickets([]);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchSupportData();
  }, [fetchSupportData]);

  const vendorMap = useMemo(() => {
    const map = {};

    vendors.forEach((vendor) => {
      const key = vendor.authUserId || vendor._id || vendor.id;
      if (!key) return;

      map[key] = vendor.companyName || vendor.fullName || "Unknown Vendor";
    });

    return map;
  }, [vendors]);

  const enrichedTickets = useMemo(
    () =>
      tickets.map((ticket) => ({
        ...ticket,
        vendorName:
          ticket.vendorName ||
          vendorMap[ticket.vendorAuthUserId] ||
          "Unknown Vendor",
      })),
    [tickets, vendorMap],
  );

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return enrichedTickets;

    return enrichedTickets.filter((ticket) =>
      [
        ticket.ticketId,
        ticket.vendorName,
        ticket.subject,
        ticket.status,
        ticket.priority,
        ticket.categoryLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [enrichedTickets, search]);

  const stats = useMemo(
    () => ({
      total: enrichedTickets.length,
      open: enrichedTickets.filter((ticket) => ticket.status === "OPEN").length,
      inProgress: enrichedTickets.filter((ticket) => ticket.status === "IN_PROGRESS").length,
      resolved: enrichedTickets.filter((ticket) => ticket.status === "RESOLVED").length,
    }),
    [enrichedTickets],
  );

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
          Support
        </Typography>
        <Typography
          sx={{ mt: 0.45, color: "#9CA3AF", fontSize: 13, fontWeight: 500 }}
        >
          Manage vendor support tickets and communications.
        </Typography>

        <Box
          sx={{
            mt: 2,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", xl: "repeat(4, 1fr)" },
            gap: 1.35,
          }}
        >
          <MetricCard
            label="Total Tickets"
            value={stats.total}
            icon={<SupportAgentOutlined sx={{ fontSize: 16, color: "#8B847D" }} />}
            bubbleColor="rgba(209, 203, 197, 0.25)"
          />
          <MetricCard
            label="Open"
            value={stats.open}
            icon={<ReportProblemOutlined sx={{ fontSize: 16, color: "#4F83FF" }} />}
            bubbleColor="rgba(169, 196, 255, 0.22)"
          />
          <MetricCard
            label="In Progress"
            value={stats.inProgress}
            icon={<PendingOutlined sx={{ fontSize: 16, color: "#E4B314" }} />}
            bubbleColor="rgba(240, 214, 143, 0.24)"
          />
          <MetricCard
            label="Resolved"
            value={stats.resolved}
            icon={<CheckCircleOutlineOutlined sx={{ fontSize: 16, color: "#3AC46F" }} />}
            bubbleColor="rgba(179, 235, 199, 0.24)"
          />
        </Box>

        <Card
          sx={{
            mt: 1.5,
            p: 1.5,
            borderRadius: 1.2,
            border: "1px solid #E9E1DB",
            boxShadow: "none",
            bgcolor: "#FFFFFF",
          }}
        >
          <Stack
            direction={{ xs: "column", xl: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", xl: "center" }}
            spacing={1.25}
          >
            <OutlinedInput
              fullWidth
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tickets..."
              startAdornment={
                <InputAdornment position="start">
                  <SearchOutlined sx={{ color: "#B4ADA6", fontSize: 17 }} />
                </InputAdornment>
              }
              sx={{
                maxWidth: { xs: "100%", xl: 415 },
                height: 38,
                bgcolor: "#FBF8F6",
                borderRadius: 1,
                fontSize: 12.5,
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#EEE6E0" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#D7C8BC",
                  borderWidth: "1px",
                },
              }}
            />

            <Stack direction="row" spacing={0.9} flexWrap="wrap" useFlexGap>
              {STATUS_FILTERS.map((item) => {
                const active = statusFilter === item;

                return (
                  <Button
                    key={item}
                    onClick={() => setStatusFilter(item)}
                    sx={{
                      minWidth: 88,
                      minHeight: 30,
                      borderRadius: 1,
                      bgcolor: active ? "#F1DED4" : "#F8F4F1",
                      color: active ? "#4F433B" : "#8F8A84",
                      border: "1px solid #ECE4DE",
                      fontWeight: 600,
                      textTransform: "none",
                      fontSize: 11.25,
                      boxShadow: "none",
                      "&:hover": {
                        bgcolor: active ? "#EBD7CB" : "#F3EEEA",
                        boxShadow: "none",
                      },
                    }}
                  >
                    {item === "ALL" ? "All" : formatStatusLabel(item)}
                  </Button>
                );
              })}
            </Stack>
          </Stack>
        </Card>

        <Card
          sx={{
            mt: 1.15,
            borderRadius: 1.2,
            border: "1px solid #E9E1DB",
            boxShadow: "none",
            overflow: "hidden",
            bgcolor: "#FFFFFF",
          }}
        >
          {loading ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{ minHeight: 320 }}
              spacing={2}
            >
              <CircularProgress />
              <Typography sx={{ fontSize: 13, color: "#8E8882" }}>
                Loading support tickets...
              </Typography>
            </Stack>
          ) : error ? (
            <Box sx={{ p: 3 }}>
              <Alert severity="error" sx={{ borderRadius: 1 }}>
                {error}
              </Alert>
              <Button sx={{ mt: 1.5 }} variant="contained" onClick={fetchSupportData}>
                Retry
              </Button>
            </Box>
          ) : filteredTickets.length === 0 ? (
            <Box
              sx={{
                m: 2,
                minHeight: 180,
                borderRadius: 1,
                border: "1px dashed #E6DED7",
                bgcolor: "#FCFAF8",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Typography sx={{ fontSize: 13, color: "#A39D96", fontWeight: 500 }}>
                No tickets found matching your criteria
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      "& th": {
                        borderBottom: "1px solid #EFE8E3",
                        py: 1.4,
                        px: 1.65,
                      },
                    }}
                  >
                    <TableCell sx={tableHeadCellSx}>TICKET ID</TableCell>
                    <TableCell sx={tableHeadCellSx}>VENDOR</TableCell>
                    <TableCell sx={tableHeadCellSx}>SUBJECT</TableCell>
                    <TableCell sx={tableHeadCellSx}>PRIORITY</TableCell>
                    <TableCell sx={tableHeadCellSx}>STATUS</TableCell>
                    <TableCell sx={tableHeadCellSx}>CREATED</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTickets.map((ticket) => {
                    const avatarTone = getVendorAvatarTone(ticket.vendorName);

                    return (
                      <TableRow
                        key={ticket._id || ticket.ticketId}
                        hover
                        sx={{
                          "& td": {
                            borderBottom: "1px solid #F4EEEA",
                            py: 1.25,
                            px: 1.65,
                          },
                          "&:last-child td": { borderBottom: "none" },
                          "&:hover": { bgcolor: "#FCFAF8" },
                        }}
                      >
                        <TableCell sx={{ ...tableBodyCellSx, fontWeight: 500, color: "#3E3A36" }}>
                          {ticket.ticketId || "-"}
                        </TableCell>

                        <TableCell sx={tableBodyCellSx}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar
                              sx={{
                                width: 24,
                                height: 24,
                                fontSize: 9.5,
                                fontWeight: 700,
                                bgcolor: avatarTone.bg,
                                color: avatarTone.color,
                              }}
                            >
                              {getInitials(ticket.vendorName)}
                            </Avatar>
                            <Typography
                              sx={{
                                maxWidth: 135,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                fontSize: 12.5,
                                color: "#3E3A36",
                                fontWeight: 500,
                              }}
                            >
                              {ticket.vendorName}
                            </Typography>
                          </Stack>
                        </TableCell>

                        <TableCell sx={tableBodyCellSx}>
                          <Typography
                            sx={{
                              maxWidth: 340,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              fontSize: 12.5,
                              color: "#3E3A36",
                              fontWeight: 500,
                            }}
                          >
                            {ticket.subject}
                          </Typography>
                          <Typography
                            sx={{
                              mt: 0.25,
                              fontSize: 11,
                              color: "#A39D96",
                              fontWeight: 500,
                            }}
                          >
                            Last update: {formatRelativeTime(ticket.updatedAt || ticket.createdAt)}
                          </Typography>
                        </TableCell>

                        <TableCell sx={tableBodyCellSx}>{priorityChip(ticket.priority)}</TableCell>
                        <TableCell sx={tableBodyCellSx}>{statusChip(ticket.status)}</TableCell>
                        <TableCell sx={{ ...tableBodyCellSx, color: "#8E8882" }}>
                          {ticket.createdAt
                            ? new Date(ticket.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                            : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </Box>
    </Box>
  );
}

function MetricCard({ icon, label, value, bubbleColor }) {
  return (
    <Card
      sx={{
        p: 1.75,
        borderRadius: 1.2,
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
          top: 10,
          right: -10,
          width: 62,
          height: 62,
          borderRadius: "50%",
          bgcolor: bubbleColor || "rgba(220, 211, 204, 0.22)",
        }}
      />
      <Stack direction="row" spacing={1.1} alignItems="flex-start">
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            bgcolor: "#FBF6F2",
            display: "grid",
            placeItems: "center",
            zIndex: 1,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography sx={{ fontSize: 11.5, color: "#A39D96", fontWeight: 500 }}>
            {label}
          </Typography>
          <Typography
            sx={{
              mt: 0.45,
              fontSize: 31,
              fontWeight: 700,
              color: "#1F2937",
              lineHeight: 1,
            }}
          >
            {value}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}

const statusChip = (status = "") => {
  const normalized = String(status || "").toUpperCase();
  const map = {
    OPEN: { bg: "#EEF4FF", color: "#4F83FF", dot: "#4F83FF", label: "Open" },
    IN_PROGRESS: {
      bg: "#FFF5DD",
      color: "#E2A500",
      dot: "#E2A500",
      label: "In Progress",
    },
    RESOLVED: {
      bg: "#EAFBF1",
      color: "#22C55E",
      dot: "#22C55E",
      label: "Resolved",
    },
    CLOSED: {
      bg: "#F1EFED",
      color: "#9B948D",
      dot: "#9B948D",
      label: "Closed",
    },
  };
  const config = map[normalized] || {
    bg: "#F3F4F6",
    color: "#6B7280",
    dot: "#6B7280",
    label: formatStatusLabel(normalized),
  };

  return (
    <Chip
      size="small"
      label={
        <Stack direction="row" spacing={0.6} alignItems="center">
          <Box
            sx={{
              width: 5.5,
              height: 5.5,
              borderRadius: 999,
              bgcolor: config.dot,
            }}
          />
          <span>{config.label}</span>
        </Stack>
      }
      sx={{
        height: 23,
        borderRadius: 1,
        bgcolor: config.bg,
        color: config.color,
        fontWeight: 600,
        fontSize: 10.5,
        "& .MuiChip-label": { px: 1 },
      }}
    />
  );
};

const priorityChip = (priority = "") => {
  const value = String(priority).toUpperCase();
  const map = {
    HIGH: { bg: "#FFF2E0", color: "#F59E0B", icon: "△", label: "High" },
    URGENT: { bg: "#FDEBEC", color: "#EF4444", icon: "△", label: "Urgent" },
    MEDIUM: { bg: "#EEF4FF", color: "#4F83FF", icon: "○", label: "Medium" },
    LOW: { bg: "#F4F2F0", color: "#9C948D", icon: "○", label: "Low" },
  };
  const config = map[value] || {
    bg: "#F3F4F6",
    color: "#6B7280",
    icon: "○",
    label: priority || "Unknown",
  };

  return (
    <Chip
      size="small"
      label={
        <Stack direction="row" spacing={0.6} alignItems="center">
          <span style={{ fontSize: "10px", lineHeight: 1 }}>{config.icon}</span>
          <span>{config.label}</span>
        </Stack>
      }
      sx={{
        height: 23,
        borderRadius: 1,
        bgcolor: config.bg,
        color: config.color,
        fontWeight: 600,
        fontSize: 10.5,
        "& .MuiChip-label": { px: 1 },
      }}
    />
  );
};

const tableHeadCellSx = {
  fontSize: 10.5,
  fontWeight: 700,
  color: "#AEA7A0",
  letterSpacing: "0.04em",
  whiteSpace: "nowrap",
};

const tableBodyCellSx = {
  fontSize: 12.5,
  color: "#5A5550",
  verticalAlign: "middle",
};
