import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  OutlinedInput,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  AddOutlined,
  ChatBubbleOutlineRounded,
  CloseOutlined,
  DescriptionOutlined,
  HeadsetMicOutlined,
  InfoOutlined,
  LightbulbOutlined,
  PhoneOutlined,
  ReceiptLongOutlined,
  SearchOutlined,
  SupportAgentOutlined,
  TagOutlined,
} from "@mui/icons-material";
import { createTicketApi, getTicketsApi } from "../../api/support.api";

const STATUS_FILTERS = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const CATEGORY_OPTIONS = [
  {
    value: "TECHNICAL_ISSUE",
    label: "Technical Issue",
    description: "Report bugs or technical problems",
    icon: <SupportAgentOutlined sx={{ fontSize: 16 }} />,
  },
  {
    value: "BILLING",
    label: "Billing",
    description: "Questions about payments and invoices",
    icon: <ReceiptLongOutlined sx={{ fontSize: 16 }} />,
  },
  {
    value: "ACCOUNT",
    label: "Account",
    description: "Account settings and credentials",
    icon: <InfoOutlined sx={{ fontSize: 16 }} />,
  },
  {
    value: "FEATURE_REQUEST",
    label: "Feature Request",
    description: "Suggest new features or improvements",
    icon: <LightbulbOutlined sx={{ fontSize: 16 }} />,
  },
  {
    value: "GENERAL",
    label: "General",
    description: "General questions and inquiries",
    icon: <DescriptionOutlined sx={{ fontSize: 16 }} />,
  },
];
const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH"];

export default function VendorSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [openNewTicket, setOpenNewTicket] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    title: "",
    category: "TECHNICAL_ISSUE",
    priority: "MEDIUM",
    description: "",
  });

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
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load support tickets",
      );
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
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
            err?.response?.data?.error ||
            err?.message ||
            "Failed to load support tickets",
        );
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [statusFilter]);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tickets;
    return tickets.filter((item) =>
      [
        item.ticketId,
        item.subject,
        item.categoryLabel,
        item.priority,
        item.statusLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [tickets, search]);

  const stats = useMemo(() => {
    const openCount = tickets.filter((ticket) => ticket.status === "OPEN").length;
    const inProgressCount = tickets.filter(
      (ticket) => ticket.status === "IN_PROGRESS",
    ).length;
    const resolvedCount = tickets.filter(
      (ticket) => ticket.status === "RESOLVED",
    ).length;
    const resolvedTimes = tickets
      .filter((ticket) => ticket.status === "RESOLVED")
      .map((ticket) => {
        const created = new Date(ticket.createdAt);
        const updated = new Date(ticket.updatedAt || ticket.createdAt);
        const diff = updated.getTime() - created.getTime();
        return diff > 0 ? diff / (1000 * 60 * 60) : null;
      })
      .filter((value) => value !== null);

    const averageResponseHours = resolvedTimes.length
      ? resolvedTimes.reduce((sum, value) => sum + value, 0) / resolvedTimes.length
      : 0;

    return {
      openCount,
      inProgressCount,
      resolvedCount,
      averageResponseHours,
    };
  }, [tickets]);

  const handleFormChange = (key) => (event) => {
    setForm((prev) => ({
      ...prev,
      [key]: event.target.value,
    }));
  };

  const handleCreateTicket = async () => {
    try {
      setSubmitting(true);
      setFormError("");

      if (!form.title.trim()) {
        throw new Error("Subject is required");
      }

      if (!form.description.trim()) {
        throw new Error("Description is required");
      }

      await createTicketApi(form);
      setOpenNewTicket(false);
      setForm({
        title: "",
        category: "TECHNICAL_ISSUE",
        priority: "MEDIUM",
        description: "",
      });
      await fetchTickets();
    } catch (err) {
      const backendErrors = err?.response?.data?.errors;
      setFormError(
        (Array.isArray(backendErrors) && backendErrors[0]?.msg) ||
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to create ticket",
      );
    } finally {
      setSubmitting(false);
    }
  };

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
            Support Center
          </Typography>
          <Typography
            sx={{ mt: 0.5, color: "#9CA3AF", fontSize: 13, fontWeight: 500 }}
          >
            Get help and manage your support tickets.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={() => setOpenNewTicket(true)}
          sx={{
            minHeight: 36,
            px: 1.5,
            borderRadius: 1,
            bgcolor: "#E9CFC2",
            color: "#5F4A40",
            boxShadow: "none",
            fontSize: 12.5,
            fontWeight: 600,
            "&:hover": {
              bgcolor: "#DFC1B3",
              boxShadow: "none",
            },
          }}
        >
          New Ticket
        </Button>
      </Stack>

      <Box
        sx={{
          mt: 1.5,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 1.5,
        }}
      >
        <SupportActionCard
          icon={<HeadsetMicOutlined sx={{ fontSize: 18 }} />}
          title="Raise Ticket"
          description="Submit a new support request and track its progress."
          badge="Support"
          color="#D4B5A5"
          onClick={() => setOpenNewTicket(true)}
        />
        <SupportActionCard
          icon={<ChatBubbleOutlineRounded sx={{ fontSize: 18 }} />}
          title="Live Chat"
          description="Chat with our support team through the ticket thread."
          badge="Messages"
          color="#10B981"
        />
        <SupportActionCard
          icon={<PhoneOutlined sx={{ fontSize: 18 }} />}
          title="Call Support"
          description="Use your tickets to request a callback from the team."
          badge="Phone"
          color="#1DA1F2"
        />
        <SupportActionCard
          icon={<InfoOutlined sx={{ fontSize: 18 }} />}
          title="FAQ"
          description="Browse common categories before opening a new issue."
          badge="Help"
          color="#F59E0B"
        />
      </Box>

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
        <MetricCard label="Open Tickets" value={stats.openCount} accent="#3B82F6" />
        <MetricCard
          label="In Progress"
          value={stats.inProgressCount}
          accent="#F59E0B"
        />
        <MetricCard label="Resolved" value={stats.resolvedCount} accent="#10B981" />
        <MetricCard
          label="Avg. Response"
          value={`${formatHours(stats.averageResponseHours)}h`}
          accent="#8B5CF6"
        />
      </Box>

      <Card
        sx={{
          mt: 1.5,
          p: 2,
          borderRadius: 1,
          border: "1px solid #E9E1DB",
          boxShadow: "none",
        }}
      >
        <Stack
          direction={{ xs: "column", lg: "row" }}
          justifyContent="space-between"
          spacing={1.5}
          alignItems={{ xs: "stretch", lg: "center" }}
        >
          <Box>
            <Typography
              sx={{ fontSize: 16, fontWeight: 700, color: "#1F2937", lineHeight: 1.2 }}
            >
              Your Tickets
            </Typography>
            <Typography
              sx={{ mt: 0.35, fontSize: 12.5, color: "#9CA3AF", fontWeight: 500 }}
            >
              Track and manage your support requests.
            </Typography>
          </Box>

          <OutlinedInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tickets..."
            startAdornment={
              <InputAdornment position="start">
                <SearchOutlined sx={{ color: "#B3ACA5", fontSize: 18 }} />
              </InputAdornment>
            }
            sx={{
              height: 40,
              minWidth: { xs: "100%", lg: 250 },
              bgcolor: "#FFFFFF",
              borderRadius: 1,
              fontSize: 13,
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E9E1DB" },
            }}
          />
        </Stack>

        <Stack
          direction="row"
          spacing={0.75}
          sx={{ mt: 1.5, overflowX: "auto", pb: 0.25 }}
        >
          {STATUS_FILTERS.map((item) => (
            <Button
              key={item}
              onClick={() => setStatusFilter(item)}
              disableElevation
              sx={{
                minWidth: "fit-content",
                px: 1.15,
                minHeight: 28,
                borderRadius: 999,
                border: "1px solid #E9E1DB",
                bgcolor: statusFilter === item ? "#D9C2B7" : "#FFFFFF",
                color: statusFilter === item ? "#FFFFFF" : "#7C7F86",
                fontSize: 11.5,
                fontWeight: 600,
                textTransform: "none",
                "&:hover": {
                  bgcolor: statusFilter === item ? "#D1B7AB" : "#F8F3EF",
                },
              }}
            >
              {item === "ALL" ? "All" : item.replace("_", " ")}
            </Button>
          ))}
        </Stack>

        {error ? (
          <Alert severity="error" sx={{ mt: 1.5, borderRadius: 1 }}>
            {error}
          </Alert>
        ) : null}

        {loading ? (
          <Box
            sx={{
              mt: 1.5,
              minHeight: 280,
              border: "1px dashed #E5DED7",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "#FCFAF8",
            }}
          >
            <Typography sx={{ fontSize: 13, color: "#B0B5BE" }}>
              Loading tickets...
            </Typography>
          </Box>
        ) : filteredTickets.length === 0 ? (
          <Box
            sx={{
              mt: 1.5,
              minHeight: 280,
              border: "1px dashed #E5DED7",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "#FCFAF8",
            }}
          >
            <Typography sx={{ fontSize: 13, color: "#B0B5BE" }}>
              No tickets found for the current filter.
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer sx={{ mt: 1.25 }}>
              <Table size="small">
                <TableHead>
                  <TableRow
                    sx={{
                      "& th": {
                        borderBottom: "1px solid #F2ECE6",
                        py: 1.2,
                        px: 1,
                        color: "#9CA3AF",
                        fontSize: 10.5,
                        fontWeight: 700,
                        textTransform: "uppercase",
                      },
                    }}
                  >
                    <TableCell>Ticket</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTickets.map((item) => (
                    <TableRow
                      key={item._id || item.ticketId}
                      sx={{
                        "& td": {
                          borderBottom: "1px solid #F8F5F2",
                          py: 1.3,
                          px: 1,
                        },
                        "&:hover": {
                          bgcolor: "#FCFAF8",
                        },
                      }}
                    >
                      <TableCell
                        sx={{ fontSize: 12.5, fontWeight: 700, color: "#4F46E5" }}
                      >
                        {item.ticketId}
                      </TableCell>
                      <TableCell sx={{ minWidth: 240 }}>
                        <Typography
                          sx={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}
                        >
                          {item.subject}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>
                        {item.categoryLabel || item.category}
                      </TableCell>
                      <TableCell>{priorityCell(item.priority)}</TableCell>
                      <TableCell>{statusChip(item.status)}</TableCell>
                      <TableCell sx={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>
                        {formatDate(item.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography sx={{ mt: 1.5, fontSize: 11.5, color: "#B0B5BE" }}>
              Showing {filteredTickets.length} of {tickets.length} tickets
            </Typography>
          </>
        )}
      </Card>

      <NewTicketDialog
        open={openNewTicket}
        form={form}
        formError={formError}
        loading={submitting}
        onClose={() => setOpenNewTicket(false)}
        onChange={handleFormChange}
        onSubmit={handleCreateTicket}
      />
    </Box>
  );
}

function SupportActionCard({ icon, title, description, badge, color, onClick }) {
  return (
    <Card
      onClick={onClick}
      sx={{
        p: 2,
        borderRadius: 1,
        border: "1px solid #E9E1DB",
        boxShadow: "none",
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
        "&:hover": onClick
          ? {
              bgcolor: "#FCFAF8",
            }
          : undefined,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          right: -16,
          bottom: -18,
          width: 82,
          height: 82,
          borderRadius: "50%",
          bgcolor: `${color}18`,
        }}
      />

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1,
            bgcolor: color,
            color: "#FFFFFF",
            display: "grid",
            placeItems: "center",
          }}
        >
          {icon}
        </Box>

        <Typography sx={{ fontSize: 11, color: color, fontWeight: 600 }}>
          {badge}
        </Typography>
      </Stack>

      <Typography sx={{ mt: 2.2, fontSize: 16, fontWeight: 700, color: "#1F2937" }}>
        {title}
      </Typography>
      <Typography sx={{ mt: 0.5, fontSize: 12.5, color: "#9CA3AF", fontWeight: 500 }}>
        {description}
      </Typography>
    </Card>
  );
}

function MetricCard({ label, value, accent }) {
  return (
    <Card
      sx={{
        p: 1.75,
        borderRadius: 1,
        border: "1px solid #E9E1DB",
        boxShadow: "none",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            border: `2px solid ${accent}`,
          }}
        />
        <Typography sx={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>
          {label}
        </Typography>
      </Stack>
      <Typography
        sx={{
          mt: 0.65,
          fontSize: 22,
          fontWeight: 700,
          color: "#1F2937",
          lineHeight: 1.1,
        }}
      >
        {value}
      </Typography>
    </Card>
  );
}

function NewTicketDialog({
  open,
  onClose,
  form,
  onChange,
  onSubmit,
  loading,
  formError,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 1,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle sx={{ px: 2, py: 2, borderBottom: "1px solid #F0EBE6" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1F2937" }}>
              Create New Support Ticket
            </Typography>
            <Typography
              sx={{ mt: 0.45, fontSize: 12.5, color: "#9CA3AF", fontWeight: 500 }}
            >
              We'll get back to you within 2-4 hours
            </Typography>
          </Box>

          <IconButton onClick={onClose} size="small" sx={{ color: "#9CA3AF" }}>
            <CloseOutlined sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 2, py: 2 }}>
        {formError ? (
          <Alert severity="error" sx={{ mb: 1.5, borderRadius: 1 }}>
            {formError}
          </Alert>
        ) : null}

        <Stack spacing={1.8}>
          <TextField
            label="Subject *"
            value={form.title}
            onChange={onChange("title")}
            fullWidth
            size="small"
            placeholder="Brief description of your issue"
            sx={fieldSx}
          />

          <Box>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
              <TagOutlined sx={{ fontSize: 14, color: "#8D9199" }} />
              <Typography
                sx={{ fontSize: 12.5, fontWeight: 600, color: "#5B6068" }}
              >
                Category *
              </Typography>
            </Stack>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1,
              }}
            >
              {CATEGORY_OPTIONS.map((item) => {
                const selected = form.category === item.value;
                return (
                  <Button
                    key={item.value}
                    onClick={() => onChange("category")({ target: { value: item.value } })}
                    variant="outlined"
                    sx={{
                      justifyContent: "flex-start",
                      alignItems: "flex-start",
                      textAlign: "left",
                      p: 1.4,
                      minHeight: 54,
                      borderRadius: 1,
                      borderColor: selected ? "#89B9FF" : "#E3E8EF",
                      bgcolor: selected ? "#F4F8FF" : "#FFFFFF",
                      color: "#374151",
                      "&:hover": {
                        borderColor: selected ? "#89B9FF" : "#D4DCE5",
                        bgcolor: selected ? "#F4F8FF" : "#FAFBFC",
                      },
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <Box sx={{ color: "#7B8593", mt: 0.2 }}>{item.icon}</Box>
                      <Box>
                        <Typography
                          sx={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}
                        >
                          {item.label}
                        </Typography>
                        <Typography
                          sx={{
                            mt: 0.3,
                            fontSize: 11.5,
                            color: "#8D97A5",
                            fontWeight: 500,
                          }}
                        >
                          {item.description}
                        </Typography>
                      </Box>
                    </Stack>
                  </Button>
                );
              })}
            </Box>
          </Box>

          <Box>
            <Typography
              sx={{ mb: 1, fontSize: 12.5, fontWeight: 600, color: "#5B6068" }}
            >
              Priority
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                gap: 1,
              }}
            >
              {[
                {
                  value: "HIGH",
                  title: "High",
                  description: "Urgent - Needs immediate attention",
                },
                {
                  value: "MEDIUM",
                  title: "Medium",
                  description: "Normal - Standard priority",
                },
                {
                  value: "LOW",
                  title: "Low",
                  description: "Can wait - Not urgent",
                },
              ].map((item) => {
                const selected = form.priority === item.value;
                return (
                  <Button
                    key={item.value}
                    onClick={() => onChange("priority")({ target: { value: item.value } })}
                    variant="outlined"
                    sx={{
                      minHeight: 56,
                      borderRadius: 1,
                      borderColor: selected ? "#6EA8FE" : "#E3E8EF",
                      bgcolor: selected ? "#EAF3FF" : "#FFFFFF",
                      color: selected ? "#2563EB" : "#4B5563",
                      textTransform: "none",
                      "&:hover": {
                        borderColor: selected ? "#6EA8FE" : "#D4DCE5",
                        bgcolor: selected ? "#EAF3FF" : "#FAFBFC",
                      },
                    }}
                  >
                    <Stack spacing={0.35} alignItems="center">
                      <Typography
                        sx={{
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: selected ? "#2563EB" : "#374151",
                        }}
                      >
                        {item.title}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 11,
                          color: selected ? "#3B82F6" : "#8D97A5",
                          fontWeight: 500,
                        }}
                      >
                        {item.description}
                      </Typography>
                    </Stack>
                  </Button>
                );
              })}
            </Box>
          </Box>

          <TextField
            label="Description *"
            value={form.description}
            onChange={onChange("description")}
            fullWidth
            multiline
            minRows={5}
            placeholder="Provide detailed information about your issue..."
            sx={multilineFieldSx}
          />

          <Typography sx={{ mt: -0.7, fontSize: 11.5, color: "#9CA3AF", fontWeight: 500 }}>
            Please include as many details as possible to help us resolve your issue quickly
          </Typography>

          <Box
            sx={{
              borderRadius: 1,
              border: "1px solid #CFE0FF",
              bgcolor: "#EEF5FF",
              px: 1.5,
              py: 1.4,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <InfoOutlined sx={{ fontSize: 16, color: "#2563EB", mt: 0.1 }} />
              <Box>
                <Typography
                  sx={{ fontSize: 12.5, fontWeight: 700, color: "#2563EB" }}
                >
                  What happens next?
                </Typography>
                <Stack spacing={0.3} sx={{ mt: 0.7 }}>
                  <Typography sx={{ fontSize: 11.5, color: "#2563EB", fontWeight: 500 }}>
                    • You'll receive a confirmation email with your ticket number
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: "#2563EB", fontWeight: 500 }}>
                    • Our support team will review your ticket within 2-4 hours
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: "#2563EB", fontWeight: 500 }}>
                    • You can track the status of your ticket in the table below
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Box>
        </Stack>

        <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mt: 2.2 }}>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              minWidth: 118,
              minHeight: 34,
              borderRadius: 1,
              borderColor: "#E8E1DA",
              color: "#6B7280",
              fontSize: 12.5,
              fontWeight: 500,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={loading}
            sx={{
              minWidth: 130,
              minHeight: 34,
              borderRadius: 1,
              bgcolor: "#EFD9CE",
              color: "#7C6258",
              boxShadow: "none",
              fontSize: 12.5,
              fontWeight: 600,
              "&:hover": {
                bgcolor: "#E4CEC3",
                boxShadow: "none",
              },
            }}
          >
            {loading ? "Creating..." : "Create Ticket"}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function priorityCell(priority = "") {
  const color =
    priority === "HIGH"
      ? "#EF4444"
      : priority === "MEDIUM"
        ? "#F59E0B"
        : "#6B7280";

  return (
    <Typography sx={{ fontSize: 12, color, fontWeight: 600 }}>
      {formatTitle(priority)}
    </Typography>
  );
}

function statusChip(status = "") {
  const map = {
    OPEN: { bg: "#EAF2FF", color: "#3B82F6", label: "Open" },
    IN_PROGRESS: { bg: "#FFF5DD", color: "#F59E0B", label: "In Progress" },
    RESOLVED: { bg: "#EAFBF1", color: "#10B981", label: "Resolved" },
    CLOSED: { bg: "#F3F4F6", color: "#6B7280", label: "Closed" },
  };
  const config = map[status] || map.OPEN;

  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        bgcolor: config.bg,
        color: config.color,
        fontWeight: 700,
        fontSize: 10.5,
        borderRadius: 1,
        height: 22,
      }}
    />
  );
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

function formatHours(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "0.0";
  return amount.toFixed(amount >= 10 ? 1 : 1);
}

function formatTitle(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const fieldSx = {
  "& .MuiInputLabel-root": {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: 500,
  },
  "& .MuiInputBase-root": {
    minHeight: 40,
    borderRadius: 1,
    bgcolor: "#FFFFFF",
    fontSize: 12.5,
    color: "#374151",
    fontWeight: 500,
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#DCE2EA",
  },
};

const multilineFieldSx = {
  ...fieldSx,
  "& .MuiInputBase-root": {
    minHeight: 120,
    alignItems: "flex-start",
    borderRadius: 1,
    bgcolor: "#FFFFFF",
    fontSize: 12.5,
    color: "#374151",
    fontWeight: 500,
  },
};
