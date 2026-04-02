import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
  AttachMoneyOutlined,
  HourglassBottomOutlined,
  CheckCircleOutlineOutlined,
  AccountBalanceWalletOutlined,
  SearchOutlined,
  FileDownloadOutlined,
  AddOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { getInvoicesApi } from "../../api/invoice.api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const STATUS_FILTERS = ["ALL", "PENDING", "APPROVED", "PAID"];

export default function InvoicesPage() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (statusFilter !== "ALL") {
        params.status = statusFilter;
      }

      const res = await getInvoicesApi(params);
      const data = res?.data || res || [];
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load invoices",
      );
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return invoices;

    return invoices.filter((item) =>
      [
        item.invoiceNumber,
        item.vendorName,
        item.projectName,
        item.projectCode,
        item.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [invoices, search]);

  const stats = useMemo(() => {
    const totalOutstanding = invoices
      .filter((i) => normalizeStatus(i.status) !== "PAID")
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);

    const pendingReview = invoices
      .filter((i) => normalizeStatus(i.status) === "PENDING")
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);

    const approvedAmount = invoices
      .filter((i) => normalizeStatus(i.status) === "APPROVED")
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);

    const currentMonthKey = monthFromDate(new Date().toISOString());
    const paidThisMonth = invoices
      .filter(
        (i) =>
          normalizeStatus(i.status) === "PAID" &&
          monthFromDate(i.paymentDate || i.updatedAt || i.createdAt) ===
            currentMonthKey,
      )
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);

    return {
      totalOutstanding,
      pendingReview,
      approvedAmount,
      paidThisMonth,
    };
  }, [invoices]);

  const monthlyChartSource = useMemo(() => {
    const monthKeys = getRecentMonthKeys(7);

    return monthKeys.map((monthKey) => {
      const paid = invoices
        .filter(
          (item) =>
            normalizeStatus(item.status) === "PAID" &&
            monthFromDate(
              item.paymentDate || item.updatedAt || item.createdAt,
            ) === monthKey,
        )
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

      const pending = invoices
        .filter(
          (item) =>
            ["PENDING", "APPROVED"].includes(normalizeStatus(item.status)) &&
            monthFromDate(item.createdAt) === monthKey,
        )
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

      return {
        label: formatMonthKey(monthKey),
        paid,
        pending,
      };
    });
  }, [invoices]);

  const chartData = {
    labels: monthlyChartSource.map((item) => item.label),
    datasets: [
      {
        label: "Paid",
        data: monthlyChartSource.map((item) => item.paid),
        backgroundColor: "#22C55E",
        borderRadius: 6,
        barThickness: 20,
      },
      {
        label: "Pending",
        data: monthlyChartSource.map((item) => item.pending),
        backgroundColor: "#EAB308",
        borderRadius: 6,
        barThickness: 20,
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
          boxWidth: 10,
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
        grid: { color: "#F0EBE6" },
        border: { display: false },
        ticks: {
          color: "#9CA3AF",
          font: { size: 11 },
          callback: (value) => `$${Number(value).toLocaleString()}`,
        },
      },
    },
  };

  const handleExport = () => {
    const rows = filteredInvoices.map((item) => ({
      invoiceNumber: item.invoiceNumber || "",
      vendorName: item.vendorName || "",
      projectName: item.projectName || "",
      projectCode: item.projectCode || "",
      amount: item.amount || 0,
      taxAmount: item.taxAmount || 0,
      status: item.status || "",
      paymentDate: item.paymentDate
        ? new Date(item.paymentDate).toLocaleDateString()
        : "",
    }));

    const headers = Object.keys(
      rows[0] || {
        invoiceNumber: "",
        vendorName: "",
        projectName: "",
        projectCode: "",
        amount: "",
        taxAmount: "",
        status: "",
        paymentDate: "",
      },
    );

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "invoices.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusChip = (status = "") => {
    const normalized = normalizeStatus(status);

    const map = {
      PENDING: { bg: "#FCF3DD", color: "#D6A83D", label: "Pending" },
      APPROVED: { bg: "#EEF4FF", color: "#3B82F6", label: "Approved" },
      PAID: { bg: "#EAFBF1", color: "#22C55E", label: "Paid" },
      PROCESSING: { bg: "#EEF2FF", color: "#6366F1", label: "Processing" },
      OVERDUE: { bg: "#FEE2E2", color: "#DC2626", label: "Overdue" },
    };

    const current = map[normalized] || {
      bg: "#F3F4F6",
      color: "#6B7280",
      label: status || "—",
    };

    return (
      <Chip
        label={current.label}
        size="small"
        sx={{
          bgcolor: current.bg,
          color: current.color,
          fontWeight: 700,
          borderRadius: 1,
          height: 28,
        }}
      />
    );
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
      <Typography
        sx={{
          fontSize: 28,
          fontWeight: 700,
          color: "#1F2937",
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
        }}
      >
        Invoices
      </Typography>

      <Typography
        sx={{
          mt: 0.5,
          color: "#9CA3AF",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        Track payments and manage vendor invoices.
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
        <InvoiceStatCard
          icon={<AttachMoneyOutlined sx={{ fontSize: 18, color: "#D88B72" }} />}
          label="Total Outstanding"
          value={`$${stats.totalOutstanding.toLocaleString()}`}
        />
        <InvoiceStatCard
          icon={
            <HourglassBottomOutlined sx={{ fontSize: 18, color: "#EAB308" }} />
          }
          label="Pending Review"
          value={`$${stats.pendingReview.toLocaleString()}`}
        />
        <InvoiceStatCard
          icon={
            <CheckCircleOutlineOutlined
              sx={{ fontSize: 18, color: "#5B8DEF" }}
            />
          }
          label="Approved"
          value={`$${stats.approvedAmount.toLocaleString()}`}
        />
        <InvoiceStatCard
          icon={
            <AccountBalanceWalletOutlined
              sx={{ fontSize: 18, color: "#22C55E" }}
            />
          }
          label="Paid (This Month)"
          value={`$${stats.paidThisMonth.toLocaleString()}`}
        />
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
        <Typography
          sx={{
            fontSize: 16,
            fontWeight: 700,
            color: "#1F2937",
            lineHeight: 1.2,
          }}
        >
          Payment Overview
        </Typography>
        <Typography
          sx={{
            mt: 0.35,
            fontSize: 12.5,
            color: "#9CA3AF",
            fontWeight: 500,
          }}
        >
          Monthly paid vs pending invoices
        </Typography>

        <Box sx={{ mt: 1.5, height: 260 }}>
          {monthlyChartSource.some(
            (item) => item.paid > 0 || item.pending > 0,
          ) ? (
            <Bar data={chartData} options={chartOptions} />
          ) : (
            <EmptyChartBox label="No payment overview data available" />
          )}
        </Box>
      </Card>

      <Stack
        direction={{ xs: "column", xl: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", xl: "center" }}
        spacing={1.5}
        sx={{ mt: 1.5 }}
      >
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={1.25}
          sx={{ flex: 1 }}
        >
          <OutlinedInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoices..."
            startAdornment={
              <InputAdornment position="start">
                <SearchOutlined sx={{ fontSize: 18 }} />
              </InputAdornment>
            }
            sx={{
              width: { xs: "100%", lg: 320 },
              bgcolor: "#fff",
              borderRadius: 1,
              height: 40,
              "& .MuiOutlinedInput-input": {
                fontSize: 12.5,
              },
            }}
          />

          <Stack direction="row" spacing={1} flexWrap="wrap">
            {STATUS_FILTERS.map((item) => {
              const active = statusFilter === item;
              return (
                <Button
                  key={item}
                  onClick={() => setStatusFilter(item)}
                  sx={{
                    minHeight: 34,
                    px: 1.6,
                    borderRadius: 1,
                    bgcolor: active ? "#F1DED4" : "#fff",
                    color: active ? "#111827" : "#6B7280",
                    border: "1px solid #EDE7E1",
                    fontWeight: 700,
                    textTransform: "none",
                    fontSize: 12,
                  }}
                >
                  {item === "ALL"
                    ? "All"
                    : item.charAt(0) + item.slice(1).toLowerCase()}
                </Button>
              );
            })}
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlined />}
            onClick={handleExport}
            sx={{
              borderRadius: 1,
              borderColor: "#E8E1DA",
              color: "#6B7280",
              bgcolor: "#fff",
              textTransform: "none",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Export
          </Button>

          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={() => navigate("/admin/invoices/new")}
            sx={{
              borderRadius: 1,
              bgcolor: "#8D7B72",
              textTransform: "none",
              fontSize: 12,
              fontWeight: 600,
              "&:hover": { bgcolor: "#7D6B63" },
            }}
          >
            New Invoice
          </Button>
        </Stack>
      </Stack>

      <Card
        sx={{
          mt: 1.5,
          borderRadius: 1,
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
            <Typography color="text.secondary">Loading invoices...</Typography>
          </Stack>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">{error}</Alert>
            <Button sx={{ mt: 2 }} variant="contained" onClick={fetchInvoices}>
              Retry
            </Button>
          </Box>
        ) : filteredInvoices.length === 0 ? (
          <Box sx={{ p: 4 }}>
            <Typography
              sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}
            >
              No invoices found
            </Typography>
            <Typography sx={{ mt: 1, fontSize: 14, color: "#9CA3AF" }}>
              No real invoice data is available for the selected filter.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    "& .MuiTableCell-root": {
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#B0B5BE",
                      borderBottom: "1px solid #F0EBE6",
                      py: 1.75,
                    },
                  }}
                >
                  <TableCell>INVOICE ID</TableCell>
                  <TableCell>VENDOR</TableCell>
                  <TableCell>PROJECT</TableCell>
                  <TableCell>AMOUNT</TableCell>
                  <TableCell>TAX</TableCell>
                  <TableCell>STATUS</TableCell>
                  <TableCell>PAYMENT DATE</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredInvoices.map((item, index) => (
                  <TableRow
                    key={item._id || item.id || index}
                    hover
                    sx={{
                      "& .MuiTableCell-root": {
                        borderBottom: "1px solid #F7F2ED",
                        py: 1.75,
                        fontSize: 13.5,
                        color: "#6B7280",
                      },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 700, color: "#111827" }}>
                      {item.invoiceNumber || "—"}
                    </TableCell>

                    <TableCell sx={{ color: "#111827", fontWeight: 600 }}>
                      {item.vendorName || "—"}
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: 13.5,
                          color: "#111827",
                          fontWeight: 700,
                        }}
                      >
                        {item.projectName || "—"}
                      </Typography>
                      <Typography
                        sx={{ mt: 0.3, fontSize: 12, color: "#9CA3AF" }}
                      >
                        {item.projectCode || ""}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      {typeof item.amount !== "undefined"
                        ? `$${Number(item.amount).toLocaleString()}`
                        : "—"}
                    </TableCell>

                    <TableCell>
                      {typeof item.taxAmount !== "undefined"
                        ? `$${Number(item.taxAmount).toLocaleString()}`
                        : "—"}
                    </TableCell>

                    <TableCell>{statusChip(item.status)}</TableCell>

                    <TableCell>
                      {item.paymentDate
                        ? new Date(item.paymentDate).toLocaleDateString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
}

function InvoiceStatCard({ icon, label, value }) {
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
      <Stack direction="row" spacing={1.1} alignItems="center">
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1,
            bgcolor: "#FAF7F4",
            display: "grid",
            placeItems: "center",
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>
            {label}
          </Typography>
          <Typography
            sx={{ mt: 0.35, fontSize: 22, fontWeight: 700, color: "#1F2937" }}
          >
            {value}
          </Typography>
        </Box>
      </Stack>
    </Card>
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

function normalizeStatus(status = "") {
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
