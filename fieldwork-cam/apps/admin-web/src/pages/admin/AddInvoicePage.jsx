import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import { CloseOutlined, ReceiptLongOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { createInvoiceApi } from "../../api/invoice.api";
import { getProjectsApi } from "../../api/project.api";
import { getVendorsApi } from "../../api/vendor.api";

const STATUS_OPTIONS = ["PENDING", "APPROVED", "PAID"];

export default function AddInvoicePage() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  const [form, setForm] = useState({
    vendorAuthUserId: "",
    vendorName: "",
    projectId: "",
    projectCode: "",
    projectName: "",
    amount: "",
    taxAmount: "",
    status: "PENDING",
    dueDate: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subtotal = useMemo(() => Number(form.amount || 0), [form.amount]);
  const tax = useMemo(() => Number(form.taxAmount || 0), [form.taxAmount]);
  const totalAmount = useMemo(() => subtotal + tax, [subtotal, tax]);

  const fetchDependencies = async () => {
    try {
      setPageLoading(true);
      setError("");

      const [projectsRes, vendorsRes] = await Promise.all([
        getProjectsApi(),
        getVendorsApi(),
      ]);

      const projectsData = projectsRes?.data || projectsRes || [];
      const vendorsData = vendorsRes?.data || vendorsRes || [];

      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setVendors(Array.isArray(vendorsData) ? vendorsData : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load invoice dependencies",
      );
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  const handleChange = (key) => (event) => {
    setForm((prev) => ({
      ...prev,
      [key]: event.target.value,
    }));
  };

  const handleVendorChange = (event) => {
    const nextVendorAuthUserId = event.target.value;
    const vendor =
      vendors.find((item) => item.authUserId === nextVendorAuthUserId) || null;

    setForm((prev) => ({
      ...prev,
      vendorAuthUserId: nextVendorAuthUserId,
      vendorName: vendor?.companyName || vendor?.fullName || "",
    }));
  };

  const handleProjectCodeChange = (event) => {
    const nextProjectId = event.target.value;
    const project =
      projects.find((item) => (item._id || item.id) === nextProjectId) || null;

    const matchedVendor =
      vendors.find(
        (item) => item.authUserId === project?.assignedVendorAuthUserId,
      ) || null;

    setForm((prev) => ({
      ...prev,
      projectId: nextProjectId,
      projectCode: project?.workOrderNumber || "",
      projectName: project?.title || "",
      vendorAuthUserId:
        project?.assignedVendorAuthUserId || prev.vendorAuthUserId,
      vendorName:
        matchedVendor?.companyName ||
        matchedVendor?.fullName ||
        prev.vendorName,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      if (!form.vendorAuthUserId) {
        throw new Error("Vendor is required");
      }

      if (!form.projectId) {
        throw new Error("Project code is required");
      }

      if (!form.projectName.trim()) {
        throw new Error("Project name is required");
      }

      if (!form.amount) {
        throw new Error("Invoice amount is required");
      }

      await createInvoiceApi({
        invoiceNumber: `INV-${Date.now()}`,
        projectId: form.projectId,
        projectName: form.projectName,
        projectCode: form.projectCode,
        vendorAuthUserId: form.vendorAuthUserId,
        vendorName: form.vendorName,
        amount: Number(form.amount || 0),
        taxAmount: Number(form.taxAmount || 0),
        status: form.status,
        dueDate: form.dueDate || null,
        paymentDate: form.status === "PAID" ? form.dueDate || null : null,
        notes: form.notes,
      });

      navigate("/admin/invoices");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create invoice",
      );
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: 320 }}
        spacing={2}
      >
        <CircularProgress />
        <Typography color="text.secondary">
          Loading invoice dependencies...
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
        New Invoice
      </Typography>

      <Typography
        sx={{
          mt: 0.5,
          color: "#9CA3AF",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        Create a new vendor invoice for payment processing.
      </Typography>

      <Card
        sx={{
          mt: 2,
          p: { xs: 2, md: 3 },
          borderRadius: 1,
          border: "1px solid #E9E1DB",
          boxShadow: "none",
          bgcolor: "#FFFFFF",
        }}
      >
        <Typography
          sx={{
            fontSize: 18,
            fontWeight: 700,
            color: "#1F2937",
            mb: 2.5,
          }}
        >
          Invoice Details
        </Typography>

        {/* Use a stack to make the form fields vertical */}
        <Stack spacing={2.5}>
          <TextField
            label="Vendor Name *"
            select
            fullWidth
            size="small"
            value={form.vendorAuthUserId}
            onChange={handleVendorChange}
            sx={inputSx}
          >
            {vendors.map((vendor) => (
              <MenuItem key={vendor.authUserId} value={vendor.authUserId}>
                {vendor.companyName || vendor.fullName}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Project Code *"
            select
            fullWidth
            size="small"
            value={form.projectId}
            onChange={handleProjectCodeChange}
            sx={inputSx}
          >
            {projects.map((project) => (
              <MenuItem
                key={project._id || project.id}
                value={project._id || project.id}
              >
                {project.workOrderNumber || project.title}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Project Name *"
            fullWidth
            size="small"
            value={form.projectName}
            onChange={handleChange("projectName")}
            sx={inputSx}
            placeholder="e.g., Downtown Plaza Inspection"
          />

          <TextField
            label="Invoice Amount *"
            fullWidth
            size="small"
            value={form.amount}
            onChange={handleChange("amount")}
            sx={inputSx}
            placeholder="$ 0.00"
          />

          <TextField
            label="Tax Amount"
            fullWidth
            size="small"
            value={form.taxAmount}
            onChange={handleChange("taxAmount")}
            sx={inputSx}
            placeholder="$ 0.00"
          />

          <TextField
            label="Status *"
            select
            fullWidth
            size="small"
            value={form.status}
            onChange={handleChange("status")}
            sx={inputSx}
          >
            {STATUS_OPTIONS.map((status) => (
              <MenuItem key={status} value={status}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Due Date"
            fullWidth
            size="small"
            type="date"
            value={form.dueDate}
            onChange={handleChange("dueDate")}
            InputLabelProps={{ shrink: true }}
            sx={inputSx}
          />

          <TextField
            label="Notes"
            fullWidth
            multiline
            minRows={5}
            value={form.notes}
            onChange={handleChange("notes")}
            sx={inputSx}
            placeholder="Add any additional notes or comments..."
          />
        </Stack>

        <Box
          sx={{
            mt: 2.5,
            p: 2.25,
            borderRadius: 1,
            bgcolor: "#FBF8F5",
            border: "1px solid #EFE7E0",
          }}
        >
          <Stack spacing={1.2}>
            <SummaryLine
              label="Subtotal"
              value={`$${subtotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
            />

            <SummaryLine
              label="Tax"
              value={`$${tax.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              withDivider
            />

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                sx={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#1F2937",
                }}
              >
                Total Amount
              </Typography>

              <Typography
                sx={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#1F2937",
                }}
              >
                $$
                {totalAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
            </Stack>
          </Stack>
        </Box>

        {error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : null}

        <Stack
          direction="row"
          justifyContent="flex-end"
          spacing={1.5}
          sx={{ mt: 3 }}
        >
          <Button
            variant="outlined"
            onClick={() => navigate("/admin/invoices")}
            startIcon={<CloseOutlined />}
            sx={{
              borderRadius: 1,
              borderColor: "#E8E1DA",
              color: "#6B7280",
              textTransform: "none",
              fontSize: 12,
              fontWeight: 600,
              minWidth: 110,
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={<ReceiptLongOutlined />}
            sx={{
              borderRadius: 1,
              bgcolor: "#EAD6CB",
              color: "#1F2937",
              textTransform: "none",
              fontSize: 12.5,
              fontWeight: 700,
              minWidth: 140,
              boxShadow: "none",
              "&:hover": {
                bgcolor: "#DFC9BD",
                boxShadow: "none",
              },
            }}
          >
            {loading ? "Saving..." : "Save Invoice"}
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}

function SummaryLine({ label, value, withDivider = false }) {
  return (
    <Box
      sx={{
        pb: withDivider ? 1.2 : 0,
        borderBottom: withDivider ? "1px solid #E8DDD5" : "none",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography
          sx={{
            fontSize: 14,
            color: "#8D8D8D",
            fontWeight: 500,
          }}
        >
          {label}
        </Typography>

        <Typography
          sx={{
            fontSize: 14,
            color: "#1F2937",
            fontWeight: 700,
          }}
        >
          {value}
        </Typography>
      </Stack>
    </Box>
  );
}

const fieldLabelSx = {
  mb: 0.7,
  fontSize: 12.5,
  fontWeight: 700,
  color: "#374151",
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 1,
    bgcolor: "#FBFDFF",
    minHeight: 40,
    fontSize: 12.5,
    color: "#374151",
    "& fieldset": {
      borderColor: "#E5EBF1",
    },
    "&:hover fieldset": {
      borderColor: "#D8E0E8",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#CCD6E0",
      borderWidth: "1px",
    },
  },
  "& .MuiInputBase-input": {
    fontSize: 12.5,
    py: 1.1,
  },
};
