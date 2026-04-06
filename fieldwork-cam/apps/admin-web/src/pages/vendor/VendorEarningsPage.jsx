import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
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
  FileDownloadOutlined,
  MonetizationOnOutlined,
  PaidOutlined,
  ReceiptLongOutlined,
  SearchOutlined,
  WarningAmberOutlined,
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
import { Bar, Line } from "react-chartjs-2";
import { getInvoicesApi } from "../../api/invoice.api";
import { useAuth } from "../../auth/AuthContext";

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

const STATUS_FILTERS = ["ALL", "PAID", "APPROVED", "PENDING", "OVERDUE"];

export default function VendorEarningsPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        setError("");

        if (!user?.authUserId) {
          setInvoices([]);
          return;
        }

        const response = await getInvoicesApi({
          vendorAuthUserId: user.authUserId,
        });
        const data = response?.data || response || [];
        setInvoices(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            "Failed to load earnings",
        );
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [user?.authUserId]);

  const enrichedInvoices = useMemo(
    () => invoices.map((invoice) => enrichInvoice(invoice)),
    [invoices],
  );

  const yearOptions = useMemo(() => {
    const years = new Set([new Date().getFullYear()]);
    enrichedInvoices.forEach((invoice) => {
      const keyDate =
        invoice.paymentDate ||
        invoice.invoiceDate ||
        invoice.createdAt ||
        invoice.updatedAt;
      const date = new Date(keyDate);
      if (!Number.isNaN(date.getTime())) years.add(date.getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [enrichedInvoices]);

  const selectedYearInvoices = useMemo(
    () =>
      enrichedInvoices.filter(
        (invoice) => getInvoiceYear(invoice) === Number(selectedYear),
      ),
    [enrichedInvoices, selectedYear],
  );

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return selectedYearInvoices.filter((invoice) => {
      const matchesStatus =
        statusFilter === "ALL" ? true : invoice.displayStatus === statusFilter;
      const matchesSearch = query
        ? [
            invoice.invoiceNumber,
            invoice.projectName,
            invoice.projectCode,
            invoice.statusLabel,
            invoice.paymentTerms,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query)
        : true;
      return matchesStatus && matchesSearch;
    });
  }, [search, selectedYearInvoices, statusFilter]);

  const stats = useMemo(() => {
    const paidInvoices = selectedYearInvoices.filter(
      (invoice) => invoice.displayStatus === "PAID",
    );
    const pendingInvoices = selectedYearInvoices.filter(
      (invoice) => invoice.displayStatus === "PENDING",
    );
    const approvedInvoices = selectedYearInvoices.filter(
      (invoice) => invoice.displayStatus === "APPROVED",
    );
    const overdueInvoices = selectedYearInvoices.filter(
      (invoice) => invoice.displayStatus === "OVERDUE",
    );
    const currentMonthKey = monthKey(new Date());
    const paidThisMonth = paidInvoices
      .filter(
        (invoice) =>
          monthKey(invoice.paymentDate || invoice.updatedAt || invoice.createdAt) ===
          currentMonthKey,
      )
      .reduce((sum, invoice) => sum + invoice.amountValue, 0);

    return {
      totalEarnings: paidInvoices.reduce(
        (sum, invoice) => sum + invoice.amountValue,
        0,
      ),
      pendingPayments: [...pendingInvoices, ...approvedInvoices].reduce(
        (sum, invoice) => sum + invoice.amountValue,
        0,
      ),
      paidThisMonth,
      overdueAmount: overdueInvoices.reduce(
        (sum, invoice) => sum + invoice.amountValue,
        0,
      ),
      pendingCount: pendingInvoices.length,
      approvedCount: approvedInvoices.length,
      overdueCount: overdueInvoices.length,
    };
  }, [selectedYearInvoices]);

  const monthlySeries = useMemo(() => {
    const keys = getYearMonthKeys(selectedYear);
    return keys.map((key) => ({
      label: formatMonthKey(key),
      earned: selectedYearInvoices
        .filter((invoice) => monthKey(invoice.invoiceDate || invoice.createdAt) === key)
        .reduce((sum, invoice) => sum + invoice.amountValue, 0),
      paid: selectedYearInvoices
        .filter(
          (invoice) =>
            invoice.displayStatus === "PAID" &&
            monthKey(invoice.paymentDate || invoice.updatedAt || invoice.createdAt) ===
              key,
        )
        .reduce((sum, invoice) => sum + invoice.amountValue, 0),
    }));
  }, [selectedYear, selectedYearInvoices]);

  const weeklySeries = useMemo(() => {
    const weeks = getLastFourWeekRanges();
    return weeks.map((range) => ({
      label: range.label,
      amount: selectedYearInvoices
        .filter((invoice) => {
          const date = new Date(invoice.paymentDate || invoice.createdAt);
          if (Number.isNaN(date.getTime())) return false;
          return date >= range.start && date <= range.end;
        })
        .reduce((sum, invoice) => sum + invoice.amountValue, 0),
    }));
  }, [selectedYearInvoices]);

  const payoutSummary = useMemo(() => {
    const nextPayout = selectedYearInvoices
      .filter((invoice) => invoice.displayStatus === "APPROVED")
      .reduce((sum, invoice) => sum + invoice.amountValue, 0);
    const lastPaidInvoice = [...selectedYearInvoices]
      .filter((invoice) => invoice.displayStatus === "PAID" && invoice.paymentDate)
      .sort(
        (a, b) =>
          new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime(),
      )[0];

    return {
      nextPayout,
      nextPayoutDate: calculateNextPayoutDate(selectedYearInvoices),
      lastPayoutAmount: lastPaidInvoice?.amountValue || 0,
      lastPayoutDate: lastPaidInvoice?.paymentDate || null,
      avgPayoutDays: calculateAveragePayoutDays(selectedYearInvoices),
    };
  }, [selectedYearInvoices]);

  const statusCounts = useMemo(
    () => ({
      ALL: selectedYearInvoices.length,
      PAID: selectedYearInvoices.filter((item) => item.displayStatus === "PAID").length,
      PENDING: selectedYearInvoices.filter((item) => item.displayStatus === "PENDING")
        .length,
      APPROVED: selectedYearInvoices.filter(
        (item) => item.displayStatus === "APPROVED",
      ).length,
      OVERDUE: selectedYearInvoices.filter((item) => item.displayStatus === "OVERDUE")
        .length,
    }),
    [selectedYearInvoices],
  );

  const lineChartData = {
    labels: monthlySeries.map((item) => item.label),
    datasets: [
      {
        label: "Earned",
        data: monthlySeries.map((item) => item.earned),
        borderColor: "#0EA5A5",
        backgroundColor: "rgba(14,165,165,0.10)",
        fill: true,
        tension: 0.42,
        pointRadius: 0,
        borderWidth: 2,
      },
      {
        label: "Paid",
        data: monthlySeries.map((item) => item.paid),
        borderColor: "#6366F1",
        backgroundColor: "rgba(99,102,241,0.08)",
        fill: true,
        tension: 0.42,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  const lineChartOptions = {
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
        grid: { color: "#F2ECE6" },
        border: { display: false },
        ticks: {
          color: "#9CA3AF",
          font: { size: 11 },
          callback: (value) => formatCompactCurrency(Number(value || 0)),
        },
      },
    },
  };

  const barChartData = {
    labels: weeklySeries.map((item) => item.label),
    datasets: [
      {
        label: "Weekly Amount",
        data: weeklySeries.map((item) => item.amount),
        backgroundColor: ["#CCD7FF", "#C8D3FF", "#C5D0FF", "#5B5CEB"],
        borderRadius: 4,
        barThickness: 36,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
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
        ticks: {
          color: "#9CA3AF",
          font: { size: 11 },
          callback: (value) => formatCompactCurrency(Number(value || 0)),
        },
      },
    },
  };

  const handleExport = () => {
    const rows = filteredInvoices.map((invoice) => ({
      invoiceNumber: invoice.invoiceNumber || "",
      projectName: invoice.projectName || "",
      projectCode: invoice.projectCode || "",
      amount: invoice.amountValue,
      status: invoice.statusLabel,
      dueDate: formatDate(invoice.dueDate),
      paidOn: formatDate(invoice.paymentDate),
      paymentTerms: invoice.paymentTerms || "",
    }));

    const headers = Object.keys(
      rows[0] || {
        invoiceNumber: "",
        projectName: "",
        projectCode: "",
        amount: "",
        status: "",
        dueDate: "",
        paidOn: "",
        paymentTerms: "",
      },
    );

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) =>
            `"${String(row[header] ?? "").replace(/"/g, '""')}"`,
          )
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `vendor-earnings-${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            Earnings & Payments
          </Typography>
          <Typography
            sx={{ mt: 0.5, color: "#9CA3AF", fontSize: 13, fontWeight: 500 }}
          >
            Track your revenue, payouts, and invoice records.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            select
            size="small"
            value={selectedYear}
            onChange={(event) => setSelectedYear(Number(event.target.value))}
            sx={{
              minWidth: 104,
              bgcolor: "#FFFFFF",
              borderRadius: 1,
              "& .MuiOutlinedInput-root": {
                height: 36,
                borderRadius: 1,
                fontSize: 12.5,
                fontWeight: 600,
              },
            }}
          >
            {yearOptions.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="contained"
            startIcon={<FileDownloadOutlined />}
            onClick={handleExport}
            sx={{
              minHeight: 36,
              px: 1.5,
              borderRadius: 1,
              bgcolor: "#6D5EF6",
              color: "#FFFFFF",
              boxShadow: "none",
              fontSize: 12.5,
              fontWeight: 600,
              textTransform: "none",
              "&:hover": {
                bgcolor: "#5D4FE8",
                boxShadow: "none",
              },
            }}
          >
            Export
          </Button>
        </Stack>
      </Stack>

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
        <EarningStatCard
          icon={<MonetizationOnOutlined sx={{ fontSize: 18 }} />}
          label="Total Earnings"
          value={formatCurrency(stats.totalEarnings)}
          accent="#10B981"
          helper={`${formatCurrency(stats.paidThisMonth)} paid this month`}
        />
        <EarningStatCard
          icon={<ReceiptLongOutlined sx={{ fontSize: 18 }} />}
          label="Pending Payments"
          value={formatCurrency(stats.pendingPayments)}
          accent="#F59E0B"
          helper={`${stats.pendingCount} invoices`}
        />
        <EarningStatCard
          icon={<PaidOutlined sx={{ fontSize: 18 }} />}
          label="Approved"
          value={formatCurrency(
            selectedYearInvoices
              .filter((invoice) => invoice.displayStatus === "APPROVED")
              .reduce((sum, invoice) => sum + invoice.amountValue, 0),
          )}
          accent="#8B5CF6"
          helper={`${stats.approvedCount} invoices`}
        />
        <EarningStatCard
          icon={<WarningAmberOutlined sx={{ fontSize: 18 }} />}
          label="Overdue"
          value={formatCurrency(stats.overdueAmount)}
          accent="#EF4444"
          helper={`${stats.overdueCount} overdue`}
        />
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mt: 1.5, borderRadius: 1 }}>
          {error}
        </Alert>
      ) : null}

      <SectionCard title="Monthly Earnings" subtitle="Earned vs paid breakdown">
        <Box sx={{ mt: 1.5, height: 270 }}>
          {monthlySeries.some((item) => item.earned > 0 || item.paid > 0) ? (
            <Line data={lineChartData} options={lineChartOptions} />
          ) : (
            <EmptyChart label="No earnings trend available for this year" />
          )}
        </Box>
      </SectionCard>

      <Box
        sx={{
          mt: 1.5,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "1.2fr 1fr" },
          gap: 1.5,
          alignItems: "stretch",
        }}
      >
        <SectionCard
          title="This Month"
          subtitle="Weekly earnings and invoice activity"
        >
          <Box sx={{ mt: 1.5, height: 210 }}>
            {weeklySeries.some((item) => item.amount > 0) ? (
              <Bar data={barChartData} options={barChartOptions} />
            ) : (
              <EmptyChart label="No weekly payment activity available" />
            )}
          </Box>
        </SectionCard>

        <SectionCard title="Payout Summary" subtitle="Latest payout metrics">
          <Stack spacing={1.1} sx={{ mt: 1.15 }}>
            <SummaryRow
              label="Next payout"
              value={formatCurrency(payoutSummary.nextPayout)}
              meta={formatDate(payoutSummary.nextPayoutDate)}
              accent="#10B981"
            />
            <SummaryRow
              label="Last payout"
              value={formatCurrency(payoutSummary.lastPayoutAmount)}
              meta={formatDate(payoutSummary.lastPayoutDate)}
              accent="#6366F1"
            />
            <SummaryRow
              label="Avg payout time"
              value={
                payoutSummary.avgPayoutDays > 0
                  ? `${payoutSummary.avgPayoutDays.toFixed(1)} days`
                  : "N/A"
              }
              meta="From invoice to payment"
              accent="#F59E0B"
            />
          </Stack>
        </SectionCard>
      </Box>

      <SectionCard title="Payment History" subtitle="Track every invoice and payout">
        <Stack
          direction={{ xs: "column", lg: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", lg: "center" }}
          spacing={1.5}
          sx={{ mt: 1.5 }}
        >
          <Stack direction="row" spacing={0.75} sx={{ overflowX: "auto", pb: 0.25 }}>
            {STATUS_FILTERS.map((item) => {
              const active = statusFilter === item;
              return (
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
                    bgcolor: active ? "#D9C2B7" : "#FFFFFF",
                    color: active ? "#FFFFFF" : "#7C7F86",
                    fontSize: 11.5,
                    fontWeight: 600,
                    textTransform: "none",
                    "&:hover": {
                      bgcolor: active ? "#D1B7AB" : "#F8F3EF",
                    },
                  }}
                >
                  {formatStatusLabel(item)} {statusCounts[item]}
                </Button>
              );
            })}
          </Stack>

          <OutlinedInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search invoices..."
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

        {filteredInvoices.length ? (
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
                    <TableCell>Invoice</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Paid On</TableCell>
                    <TableCell>Terms</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow
                      key={invoice._id || invoice.invoiceNumber}
                      sx={{
                        "& td": {
                          borderBottom: "1px solid #F8F5F2",
                          py: 1.35,
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
                        {invoice.invoiceNumber || "N/A"}
                      </TableCell>
                      <TableCell sx={{ minWidth: 220 }}>
                        <Typography
                          sx={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}
                        >
                          {invoice.projectName || "Untitled Project"}
                        </Typography>
                        <Typography
                          sx={{
                            mt: 0.2,
                            fontSize: 11.5,
                            color: "#9CA3AF",
                            fontWeight: 500,
                          }}
                        >
                          {invoice.projectCode || "No project code"}
                        </Typography>
                      </TableCell>
                      <TableCell
                        sx={{ fontSize: 12.5, color: "#374151", fontWeight: 700 }}
                      >
                        {formatCurrency(invoice.amountValue)}
                      </TableCell>
                      <TableCell>{statusChip(invoice.displayStatus)}</TableCell>
                      <TableCell
                        sx={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}
                      >
                        {formatDate(invoice.dueDate)}
                      </TableCell>
                      <TableCell
                        sx={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}
                      >
                        {formatDate(invoice.paymentDate)}
                      </TableCell>
                      <TableCell
                        sx={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}
                      >
                        {invoice.paymentTerms || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography sx={{ mt: 1.5, fontSize: 11.5, color: "#B0B5BE" }}>
              Showing {filteredInvoices.length} of {selectedYearInvoices.length} invoices
            </Typography>
          </>
        ) : (
          <EmptyTableState label="No invoice records found for the current filters" />
        )}
      </SectionCard>
    </Box>
  );
}

function EarningStatCard({ icon, label, value, accent, helper }) {
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
          right: -14,
          bottom: -18,
          width: 84,
          height: 84,
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
          mt: 2.1,
          fontSize: 28,
          fontWeight: 700,
          color: "#1F2937",
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </Typography>
      <Typography sx={{ mt: 0.5, fontSize: 12.5, color: "#9CA3AF", fontWeight: 500 }}>
        {label}
      </Typography>
    </Card>
  );
}

function SectionCard({ title, subtitle, children }) {
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
      {children}
    </Card>
  );
}

function SummaryRow({ label, value, meta, accent }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{
        px: 1.1,
        py: 1.05,
        borderRadius: 1,
        bgcolor: "#FCFAF8",
        border: "1px solid #F0EBE6",
      }}
    >
      <Stack direction="row" spacing={0.9} alignItems="center">
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            border: `2px solid ${accent}`,
          }}
        />
        <Box>
          <Typography sx={{ fontSize: 11.5, color: "#9CA3AF", fontWeight: 600 }}>
            {label}
          </Typography>
          <Typography sx={{ mt: 0.2, fontSize: 12, color: "#B0B5BE", fontWeight: 500 }}>
            {meta}
          </Typography>
        </Box>
      </Stack>

      <Typography sx={{ fontSize: 13, color: "#1F2937", fontWeight: 700 }}>
        {value}
      </Typography>
    </Stack>
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

function EmptyTableState({ label }) {
  return (
    <Box
      sx={{
        mt: 1.25,
        minHeight: 240,
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

function statusChip(status) {
  const map = {
    PAID: { bg: "#EAFBF1", color: "#10B981", label: "Paid" },
    PENDING: { bg: "#FFF5DD", color: "#F59E0B", label: "Pending" },
    APPROVED: { bg: "#EEF2FF", color: "#6366F1", label: "Approved" },
    OVERDUE: { bg: "#FEE2E2", color: "#EF4444", label: "Overdue" },
  };
  const current = map[status] || {
    bg: "#F3F4F6",
    color: "#6B7280",
    label: "Unknown",
  };

  return (
    <Chip
      label={current.label}
      size="small"
      sx={{
        bgcolor: current.bg,
        color: current.color,
        fontWeight: 700,
        fontSize: 10.5,
        borderRadius: 1,
        height: 22,
      }}
    />
  );
}

function enrichInvoice(invoice) {
  const amountValue = Number(
    invoice?.totalDue || invoice?.amount || invoice?.subtotal || 0,
  );
  const normalizedStatus = String(invoice?.status || "").trim().toUpperCase();
  const dueDate = parseDate(invoice?.dueDate);
  const now = new Date();

  let displayStatus = "PENDING";
  if (normalizedStatus === "PAID") {
    displayStatus = "PAID";
  } else if (
    dueDate &&
    dueDate.getTime() < now.getTime() &&
    normalizedStatus !== "PAID"
  ) {
    displayStatus = "OVERDUE";
  } else if (normalizedStatus === "APPROVED") {
    displayStatus = "APPROVED";
  }

  return {
    ...invoice,
    amountValue,
    displayStatus,
    statusLabel: formatStatusLabel(displayStatus),
  };
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getInvoiceYear(invoice) {
  const candidate =
    invoice.paymentDate || invoice.invoiceDate || invoice.createdAt || invoice.updatedAt;
  const date = parseDate(candidate);
  return date ? date.getFullYear() : new Date().getFullYear();
}

function getYearMonthKeys(year) {
  return Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, "0");
    return `${year}-${month}`;
  });
}

function monthKey(value) {
  const date = parseDate(value);
  if (!date) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthKey(key) {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("en-US", { month: "short" });
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatCompactCurrency(value) {
  const amount = Number(value || 0);
  if (!amount) return "$0";
  if (amount >= 1000) return `$${Math.round(amount / 1000)}k`;
  return `$${Math.round(amount)}`;
}

function formatDate(value) {
  const date = parseDate(value);
  if (!date) return "N/A";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatStatusLabel(status) {
  if (status === "ALL") return "All";
  return String(status || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getLastFourWeekRanges() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const weeks = [];

  for (let index = 0; index < 4; index += 1) {
    const start = new Date(startOfMonth);
    start.setDate(1 + index * 7);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    weeks.push({
      label: `W${index + 1}`,
      start,
      end,
    });
  }

  return weeks;
}

function calculateAveragePayoutDays(invoices) {
  const values = invoices
    .filter((invoice) => invoice.displayStatus === "PAID" && invoice.paymentDate)
    .map((invoice) => {
      const start = parseDate(invoice.invoiceDate || invoice.createdAt);
      const end = parseDate(invoice.paymentDate);
      if (!start || !end) return null;

      const diff = end.getTime() - start.getTime();
      return diff >= 0 ? diff / (1000 * 60 * 60 * 24) : null;
    })
    .filter((value) => value !== null);

  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateNextPayoutDate(invoices) {
  const approvedInvoice = invoices
    .filter((invoice) => invoice.displayStatus === "APPROVED")
    .sort(
      (a, b) =>
        new Date(a.createdAt || a.invoiceDate).getTime() -
        new Date(b.createdAt || b.invoiceDate).getTime(),
    )[0];

  if (!approvedInvoice) return null;

  const baseDate = parseDate(
    approvedInvoice.dueDate || approvedInvoice.invoiceDate || approvedInvoice.createdAt,
  );
  if (!baseDate) return null;

  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + 3);
  return nextDate;
}
