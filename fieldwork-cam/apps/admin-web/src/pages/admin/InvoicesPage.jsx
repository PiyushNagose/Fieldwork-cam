import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  AccountBalanceWalletOutlined,
  AddOutlined,
  CheckCircleOutlineOutlined,
  FileDownloadOutlined,
  HourglassBottomOutlined,
  SearchOutlined,
  SellOutlined,
} from "@mui/icons-material";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { getInvoicesApi } from "../../api/invoice.api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const STATUS_FILTERS = ["ALL", "PENDING", "APPROVED", "PAID"];

const normalizeStatus = (status = "") => String(status).trim().toUpperCase();

const formatCurrency = (value = 0) =>
  `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const formatShortDate = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const monthFromDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const getRecentMonthKeys = (count) => {
  const result = [];
  const now = new Date();

  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    result.push(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    );
  }

  return result;
};

const formatMonthKey = (key) => {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("en-US", { month: "short" });
};

const csvEscape = (value) => {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (statusFilter !== "ALL") {
        params.status = statusFilter;
      }

      const response = await getInvoicesApi(params);
      const data = response?.data || response || [];
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
  }, [statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return invoices;

    return invoices.filter((invoice) =>
      [
        invoice.invoiceNumber,
        invoice.vendorName,
        invoice.projectName,
        invoice.projectCode,
        invoice.billToClient,
        invoice.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [invoices, search]);

  const stats = useMemo(() => {
    const pendingInvoices = invoices.filter(
      (invoice) => normalizeStatus(invoice.status) === "PENDING",
    );
    const approvedInvoices = invoices.filter(
      (invoice) => normalizeStatus(invoice.status) === "APPROVED",
    );
    const paidInvoices = invoices.filter(
      (invoice) => normalizeStatus(invoice.status) === "PAID",
    );

    const totalOutstanding = [...pendingInvoices, ...approvedInvoices].reduce(
      (sum, invoice) => sum + Number(invoice.totalDue || invoice.amount || 0),
      0,
    );
    const pendingReview = pendingInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.totalDue || invoice.amount || 0),
      0,
    );
    const approvedAmount = approvedInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.totalDue || invoice.amount || 0),
      0,
    );

    const currentMonthKey = monthFromDate(new Date().toISOString());
    const paidThisMonth = paidInvoices
      .filter(
        (invoice) =>
          monthFromDate(
            invoice.paymentDate || invoice.updatedAt || invoice.createdAt,
          ) === currentMonthKey,
      )
      .reduce(
        (sum, invoice) => sum + Number(invoice.totalDue || invoice.amount || 0),
        0,
      );

    return {
      totalOutstanding,
      pendingReview,
      approvedAmount,
      paidThisMonth,
      pendingCount: pendingInvoices.length,
      approvedCount: approvedInvoices.length,
      paidCount: paidInvoices.length,
    };
  }, [invoices]);

  const monthlyChartSource = useMemo(() => {
    const monthKeys = getRecentMonthKeys(7);

    return monthKeys.map((monthKey) => {
      const paid = invoices
        .filter(
          (invoice) =>
            normalizeStatus(invoice.status) === "PAID" &&
            monthFromDate(
              invoice.paymentDate || invoice.updatedAt || invoice.createdAt,
            ) === monthKey,
        )
        .reduce(
          (sum, invoice) => sum + Number(invoice.totalDue || invoice.amount || 0),
          0,
        );

      const pending = invoices
        .filter(
          (invoice) =>
            ["PENDING", "APPROVED"].includes(normalizeStatus(invoice.status)) &&
            monthFromDate(invoice.createdAt) === monthKey,
        )
        .reduce(
          (sum, invoice) => sum + Number(invoice.totalDue || invoice.amount || 0),
          0,
        );

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
        barThickness: 12,
      },
      {
        label: "Pending",
        data: monthlyChartSource.map((item) => item.pending),
        backgroundColor: "#EAB308",
        borderRadius: 6,
        barThickness: 12,
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
          color: "#8D8A85",
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#A39D96", font: { size: 10.5 } },
      },
      y: {
        grid: { color: "#F2ECE7" },
        border: { display: false },
        ticks: {
          color: "#A39D96",
          font: { size: 10.5 },
          callback: (value) => `$${Number(value / 1000)}k`,
        },
      },
    },
  };

  const handleExport = () => {
    const rows = filteredInvoices.map((invoice) => ({
      invoiceNumber: invoice.invoiceNumber || "",
      vendorName: invoice.vendorName || "",
      projectName: invoice.projectName || "",
      projectCode: invoice.projectCode || "",
      amount: invoice.amount || 0,
      taxAmount: invoice.taxAmount || 0,
      totalDue: invoice.totalDue || 0,
      status: invoice.status || "",
      paymentDate: invoice.paymentDate ? formatShortDate(invoice.paymentDate) : "",
    }));

    const headers = [
      "Invoice Number",
      "Vendor",
      "Project",
      "Project Code",
      "Amount",
      "Tax",
      "Total Due",
      "Status",
      "Payment Date",
    ];

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        [
          row.invoiceNumber,
          row.vendorName,
          row.projectName,
          row.projectCode,
          row.amount,
          row.taxAmount,
          row.totalDue,
          row.status,
          row.paymentDate,
        ]
          .map(csvEscape)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "invoices-export.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const statusChip = (status = "") => {
    const toneMap = {
      PENDING: { bg: "#FCF3DD", color: "#D6A83D", label: "Pending", dot: "#E0B026" },
      APPROVED: { bg: "#EEF4FF", color: "#3B82F6", label: "Approved", dot: "#4F83FF" },
      PAID: { bg: "#EAFBF1", color: "#22C55E", label: "Paid", dot: "#22C55E" },
    };
    const tone = toneMap[normalizeStatus(status)] || {
      bg: "#F3F4F6",
      color: "#6B7280",
      label: status || "Unknown",
      dot: "#6B7280",
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
                bgcolor: tone.dot,
              }}
            />
            <span>{tone.label}</span>
          </Stack>
        }
        sx={{
          height: 23,
          borderRadius: 1,
          bgcolor: tone.bg,
          color: tone.color,
          fontWeight: 600,
          fontSize: 10.5,
          "& .MuiChip-label": { px: 1 },
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
          Invoices
        </Typography>

        <Typography sx={{ mt: 0.45, color: "#9CA3AF", fontSize: 13, fontWeight: 500 }}>
          Track payments and manage vendor invoices.
        </Typography>

        <Box
          sx={{
            mt: 2,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", xl: "repeat(4, 1fr)" },
            gap: 1.35,
          }}
        >
          <InvoiceStatCard
            icon={<SellOutlined sx={{ fontSize: 16, color: "#E28D78" }} />}
            label="Total Outstanding"
            value={formatCurrency(stats.totalOutstanding)}
            bubbleColor="rgba(235, 186, 168, 0.25)"
          />
          <InvoiceStatCard
            icon={<HourglassBottomOutlined sx={{ fontSize: 16, color: "#E4B314" }} />}
            label="Pending Review"
            value={formatCurrency(stats.pendingReview)}
            subtitle={`${stats.pendingCount} invoices`}
            bubbleColor="rgba(240, 214, 143, 0.26)"
          />
          <InvoiceStatCard
            icon={<CheckCircleOutlineOutlined sx={{ fontSize: 16, color: "#5B8DEF" }} />}
            label="Approved"
            value={formatCurrency(stats.approvedAmount)}
            subtitle={`${stats.approvedCount} invoices`}
            bubbleColor="rgba(158, 188, 255, 0.22)"
          />
          <InvoiceStatCard
            icon={<AccountBalanceWalletOutlined sx={{ fontSize: 16, color: "#56C488" }} />}
            label="Paid (This Month)"
            value={formatCurrency(stats.paidThisMonth)}
            subtitle={`${stats.paidCount} invoices`}
            bubbleColor="rgba(176, 235, 201, 0.24)"
          />
        </Box>

        <Card sx={{ ...chartCardSx, mt: 1.35, p: 2.1 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1F2937" }}>
            Payment Overview
          </Typography>
          <Typography sx={{ mt: 0.25, fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>
            Monthly paid vs pending invoices
          </Typography>

          <Box sx={{ mt: 1.6, height: 220 }}>
            {monthlyChartSource.some((item) => item.paid > 0 || item.pending > 0) ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <EmptyChartBox label="No payment overview data available" />
            )}
          </Box>
        </Card>

        <Card
          sx={{
            mt: 1.5,
            p: 1.5,
            borderRadius: 1,
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
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={1.1}
            alignItems={{ xs: "stretch", lg: "center" }}
            sx={{ flex: 1 }}
          >
            <OutlinedInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search invoices..."
              startAdornment={
                <InputAdornment position="start">
                  <SearchOutlined sx={{ fontSize: 17, color: "#B4ADA6" }} />
                </InputAdornment>
              }
              sx={{
                width: { xs: "100%", lg: 320 },
                height: 38,
                bgcolor: "#FBF8F6",
                borderRadius: 1,
                fontSize: 12.5,
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#EEE6E0" },
              }}
            />

            <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
              {STATUS_FILTERS.map((item) => {
                const active = statusFilter === item;
                return (
                  <Button
                    key={item}
                    onClick={() => setStatusFilter(item)}
                    sx={{
                      px: 1.45,
                      minHeight: 28,
                      minWidth: "auto",
                      borderRadius: 1,
                      bgcolor: active ? "#F1DED4" : "#F8F4F1",
                      color: active ? "#4F433B" : "#8F8A84",
                      border: "1px solid #EDE5DF",
                      fontWeight: 600,
                      textTransform: "none",
                      fontSize: 11,
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
              startIcon={<FileDownloadOutlined sx={{ fontSize: 15 }} />}
              onClick={handleExport}
              sx={outlineButtonSx}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<AddOutlined sx={{ fontSize: 15 }} />}
              onClick={() => navigate("/admin/invoices/new")}
              sx={primaryButtonSx}
            >
              New Invoice
            </Button>
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
          <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 320 }} spacing={2}>
            <CircularProgress />
            <Typography sx={{ fontSize: 13, color: "#8E8882" }}>
              Loading invoices...
            </Typography>
          </Stack>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="error" sx={{ borderRadius: 1 }}>
              {error}
            </Alert>
            <Button sx={{ mt: 1.5 }} variant="contained" onClick={fetchInvoices}>
              Retry
            </Button>
          </Box>
        ) : filteredInvoices.length === 0 ? (
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
              No invoices found
            </Typography>
          </Box>
        ) : (
          <>
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
                    <TableCell sx={tableHeadCellSx}>INVOICE ID</TableCell>
                    <TableCell sx={tableHeadCellSx}>VENDOR</TableCell>
                    <TableCell sx={tableHeadCellSx}>PROJECT</TableCell>
                    <TableCell sx={tableHeadCellSx}>AMOUNT</TableCell>
                    <TableCell sx={tableHeadCellSx}>TAX</TableCell>
                    <TableCell sx={tableHeadCellSx}>STATUS</TableCell>
                    <TableCell sx={tableHeadCellSx}>PAYMENT DATE</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow
                      key={invoice._id || invoice.invoiceNumber}
                      hover
                      sx={{
                        "& td": {
                          borderBottom: "1px solid #F4EEEA",
                          py: 1.2,
                          px: 1.65,
                        },
                        "&:last-child td": { borderBottom: "none" },
                        "&:hover": { bgcolor: "#FCFAF8" },
                      }}
                    >
                      <TableCell sx={{ ...tableBodyCellSx, fontWeight: 600, color: "#4B5563" }}>
                        {invoice.invoiceNumber || "-"}
                      </TableCell>
                      <TableCell sx={tableBodyCellSx}>
                        <Typography sx={{ fontSize: 12.5, color: "#3E3A36", fontWeight: 600 }}>
                          {invoice.vendorName || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={tableBodyCellSx}>
                        <Typography sx={{ fontSize: 12.5, color: "#3E3A36", fontWeight: 600 }}>
                          {invoice.projectName || "-"}
                        </Typography>
                        <Typography sx={{ mt: 0.25, fontSize: 11, color: "#AAA39C" }}>
                          {invoice.projectCode || ""}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ ...tableBodyCellSx, fontWeight: 600 }}>
                        {formatCurrency(invoice.totalDue || invoice.amount || 0)}
                      </TableCell>
                      <TableCell sx={tableBodyCellSx}>
                        {formatCurrency(invoice.taxAmount || 0)}
                      </TableCell>
                      <TableCell sx={tableBodyCellSx}>{statusChip(invoice.status)}</TableCell>
                      <TableCell sx={tableBodyCellSx}>
                        {invoice.paymentDate ? formatShortDate(invoice.paymentDate) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box
              sx={{
                px: 1.65,
                py: 1.15,
                borderTop: "1px solid #F3EEEA",
              }}
            >
              <Typography sx={{ fontSize: 11, color: "#A39D96", fontWeight: 500 }}>
                Showing 1-{filteredInvoices.length} of {invoices.length} invoices
              </Typography>
            </Box>
          </>
        )}
        </Card>
      </Box>
    </Box>
  );
}

function InvoiceStatCard({ icon, label, value, subtitle, bubbleColor }) {
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
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 1,
            bgcolor: "#FBF6F2",
            display: "grid",
            placeItems: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          {icon}
        </Box>
        {subtitle ? (
          <Typography sx={{ fontSize: 10.5, color: "#A39D96", fontWeight: 500 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Stack>
      <Typography sx={{ mt: 1.35, fontSize: 29, fontWeight: 700, color: "#1F2937", lineHeight: 1, position: "relative", zIndex: 1 }}>
        {value}
      </Typography>
      <Typography sx={{ mt: 0.45, fontSize: 11.5, color: "#9CA3AF", fontWeight: 500, position: "relative", zIndex: 1 }}>
        {label}
      </Typography>
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

const chartCardSx = {
  mt: 1.5,
  p: 2,
  borderRadius: 1.2,
  border: "1px solid #E9E1DB",
  boxShadow: "none",
  bgcolor: "#FFFFFF",
};

const primaryButtonSx = {
  minWidth: 118,
  height: 36,
  borderRadius: 1,
  bgcolor: "#8D7B72",
  textTransform: "none",
  fontSize: 11.5,
  fontWeight: 600,
  boxShadow: "none",
  "&:hover": { bgcolor: "#7D6B63", boxShadow: "none" },
};

const outlineButtonSx = {
  minWidth: 88,
  height: 36,
  borderRadius: 1,
  borderColor: "#E8E0DA",
  color: "#837E78",
  bgcolor: "#FFFFFF",
  textTransform: "none",
  fontSize: 11.5,
  fontWeight: 600,
  boxShadow: "none",
  "&:hover": {
    borderColor: "#DED3CB",
    bgcolor: "#FCFAF8",
    boxShadow: "none",
  },
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
