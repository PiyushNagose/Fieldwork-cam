import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { createInvoiceApi } from "../../api/invoice.api";
import { getProjectsApi } from "../../api/project.api";
import { getVendorsApi } from "../../api/vendor.api";

const STATUS_OPTIONS = ["PENDING", "APPROVED", "PAID"];

const formatCurrency = (value = 0) =>
  `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const generateInvoiceNumber = () => `INV-${Date.now()}`;
const BILLABLE_PROJECT_STATUSES = ["Approved", "Completed"];

export default function AddInvoicePage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

  const fetchDependencies = useCallback(async () => {
    try {
      setPageLoading(true);
      setError("");

      const [projectsResponse, vendorsResponse] = await Promise.all([
        getProjectsApi(),
        getVendorsApi(),
      ]);

      const projectData = projectsResponse?.data || projectsResponse || [];
      const vendorData = vendorsResponse?.data || vendorsResponse || [];

      setProjects(Array.isArray(projectData) ? projectData : []);
      setVendors(Array.isArray(vendorData) ? vendorData : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load invoice dependencies",
      );
      setProjects([]);
      setVendors([]);
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  const selectedProject = useMemo(
    () =>
      projects.find((project) => (project._id || project.id) === form.projectId) ||
      null,
    [form.projectId, projects],
  );

  const filteredProjects = useMemo(() => {
    const billable = projects.filter((project) =>
      BILLABLE_PROJECT_STATUSES.includes(project.status),
    );

    if (!form.vendorAuthUserId) return billable;

    return billable.filter(
      (project) => project.assignedVendorAuthUserId === form.vendorAuthUserId,
    );
  }, [form.vendorAuthUserId, projects]);

  const subtotal = useMemo(() => Number(form.amount || 0), [form.amount]);
  const tax = useMemo(() => Number(form.taxAmount || 0), [form.taxAmount]);
  const totalAmount = useMemo(() => subtotal + tax, [subtotal, tax]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleVendorChange = (event) => {
    const nextVendorAuthUserId = event.target.value;
    const vendor =
      vendors.find((item) => item.authUserId === nextVendorAuthUserId) || null;

    setForm((prev) => {
      const keepProject =
        projects.find((project) => (project._id || project.id) === prev.projectId)
          ?.assignedVendorAuthUserId === nextVendorAuthUserId;

      return {
        ...prev,
        vendorAuthUserId: nextVendorAuthUserId,
        vendorName: vendor?.companyName || vendor?.fullName || "",
        projectId: keepProject ? prev.projectId : "",
        projectCode: keepProject ? prev.projectCode : "",
        projectName: keepProject ? prev.projectName : "",
      };
    });
  };

  const handleProjectChange = (event) => {
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
      vendorAuthUserId: project?.assignedVendorAuthUserId || prev.vendorAuthUserId,
      vendorName:
        matchedVendor?.companyName || matchedVendor?.fullName || prev.vendorName,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      if (!form.vendorAuthUserId) throw new Error("Vendor name is required");
      if (!form.projectId) throw new Error("Project code is required");
      if (!form.projectName.trim()) throw new Error("Project name is required");
      if (!form.amount || Number(form.amount) <= 0) {
        throw new Error("Invoice amount is required");
      }

      const paymentDate =
        form.status === "PAID" ? new Date().toISOString() : null;

      await createInvoiceApi({
        invoiceNumber: generateInvoiceNumber(),
        projectId: form.projectId,
        projectName: form.projectName.trim(),
        projectCode: form.projectCode.trim(),
        vendorAuthUserId: form.vendorAuthUserId,
        vendorName: form.vendorName.trim(),
        billToClient: selectedProject?.clientName || "",
        invoiceDate: new Date().toISOString(),
        dueDate: form.dueDate || null,
        amount: subtotal,
        subtotal,
        taxAmount: tax,
        totalDue: totalAmount,
        paymentTerms: "Net 14",
        status: form.status,
        paymentDate,
        notes: form.notes.trim(),
        lineItems: [
          {
            description: form.projectName.trim(),
            qty: 1,
            rate: subtotal,
            amount: subtotal,
          },
        ],
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
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 320 }} spacing={2}>
        <CircularProgress />
        <Typography sx={{ fontSize: 13, color: "#8E8882" }}>
          Loading invoice dependencies...
        </Typography>
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        px: { xs: 1.5, md: 2 },
        py: { xs: 2, md: 2.5 },
        bgcolor: "#F8F5F2",
        minHeight: "100%",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 1180 }}>
        <Card
          sx={{
            p: { xs: 2.25, md: 3 },
            borderRadius: 1.4,
            border: "1px solid #E7DED8",
            boxShadow: "none",
            bgcolor: "#FFFCFA",
          }}
        >
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 700,
              color: "#1F2937",
              lineHeight: 1.2,
            }}
          >
            New Invoice
          </Typography>

          <Typography sx={{ mt: 0.55, color: "#9CA3AF", fontSize: 13, fontWeight: 500 }}>
            Create a new vendor invoice for payment processing.
          </Typography>

          <Card
            sx={{
              mt: 2.5,
              p: { xs: 2, md: 2.5 },
              borderRadius: 1.2,
              border: "1px solid #ECE3DD",
              boxShadow: "none",
              bgcolor: "#FFFFFF",
            }}
          >
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#1F2937", mb: 2.4 }}>
              Invoice Details
            </Typography>

            <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              size="small"
              label="Vendor Name *"
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
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              size="small"
              label="Project Code *"
              value={form.projectId}
              onChange={handleProjectChange}
              sx={inputSx}
            >
              {filteredProjects.map((project) => (
                <MenuItem key={project._id || project.id} value={project._id || project.id}>
                  {project.workOrderNumber || project.title}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <Typography sx={{ fontSize: 11.5, color: "#A39D96", fontWeight: 500 }}>
              Only approved or completed projects are available for invoice creation.
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Project Name *"
              value={form.projectName}
              onChange={handleChange("projectName")}
              sx={inputSx}
              placeholder="e.g., Downtown Plaza Inspection"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Invoice Amount *"
              value={form.amount}
              onChange={handleChange("amount")}
              sx={inputSx}
              placeholder="$ 0.00"
              type="number"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Tax Amount"
              value={form.taxAmount}
              onChange={handleChange("taxAmount")}
              sx={inputSx}
              placeholder="$ 0.00"
              type="number"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status *"
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
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Due Date"
              value={form.dueDate}
              onChange={handleChange("dueDate")}
              InputLabelProps={{ shrink: true }}
              sx={inputSx}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              minRows={5}
              label="Notes"
              value={form.notes}
              onChange={handleChange("notes")}
              sx={multilineInputSx}
              placeholder="Add any additional notes or comments..."
            />
          </Grid>
            </Grid>

            <Box
              sx={{
                mt: 2.5,
                p: 2.15,
                borderRadius: 1.2,
                bgcolor: "#FBF8F5",
                border: "1px solid #EFE7E0",
              }}
            >
              <Stack spacing={1.1}>
                <SummaryLine label="Subtotal" value={formatCurrency(subtotal)} />
                <SummaryLine label="Tax" value={formatCurrency(tax)} withDivider />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1F2937" }}>
                    Total Amount
                  </Typography>
                  <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#1F2937" }}>
                    {formatCurrency(totalAmount)}
                  </Typography>
                </Stack>
              </Stack>
            </Box>

            {error ? (
              <Alert severity="error" sx={{ mt: 2, borderRadius: 1 }}>
                {error}
              </Alert>
            ) : null}

            <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => navigate("/admin/invoices")}
                startIcon={<CloseOutlined sx={{ fontSize: 15 }} />}
                sx={cancelButtonSx}
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={<ReceiptLongOutlined sx={{ fontSize: 15 }} />}
                sx={submitButtonSx}
              >
                {loading ? "Saving..." : "Save Invoice"}
              </Button>
            </Stack>
          </Card>
        </Card>
      </Box>
    </Box>
  );
}

function SummaryLine({ label, value, withDivider = false }) {
  return (
    <Box
      sx={{
        pb: withDivider ? 1.15 : 0,
        borderBottom: withDivider ? "1px solid #E8DDD5" : "none",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography sx={{ fontSize: 14, color: "#8D8D8D", fontWeight: 500 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 14, color: "#1F2937", fontWeight: 700 }}>
          {value}
        </Typography>
      </Stack>
    </Box>
  );
}

const inputSx = {
  "& .MuiInputLabel-root": {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: 500,
  },
  "& .MuiOutlinedInput-root": {
    borderRadius: 1,
    bgcolor: "#FFFFFF",
    minHeight: 40,
    fontSize: 12.5,
    color: "#374151",
    "& fieldset": {
      borderColor: "#E5DED7",
    },
    "&:hover fieldset": {
      borderColor: "#D8D0C8",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#D0C0B5",
      borderWidth: "1px",
    },
  },
  "& .MuiInputBase-input": {
    fontSize: 12.5,
    py: 1.1,
  },
};

const multilineInputSx = {
  ...inputSx,
  "& .MuiOutlinedInput-root": {
    ...inputSx["& .MuiOutlinedInput-root"],
    alignItems: "flex-start",
  },
};

const cancelButtonSx = {
  borderRadius: 1,
  borderColor: "#E8E1DA",
  color: "#6B7280",
  textTransform: "none",
  fontSize: 12,
  fontWeight: 600,
  minWidth: 110,
  boxShadow: "none",
  "&:hover": {
    borderColor: "#DED3CB",
    bgcolor: "#FCFAF8",
    boxShadow: "none",
  },
};

const submitButtonSx = {
  borderRadius: 1,
  bgcolor: "#D7B9A8",
  color: "#1F2937",
  textTransform: "none",
  fontSize: 12.5,
  fontWeight: 700,
  minWidth: 140,
  boxShadow: "none",
  "&:hover": {
    bgcolor: "#CCA997",
    boxShadow: "none",
  },
  "&.Mui-disabled": {
    bgcolor: "#E6DDD8",
    color: "#948C87",
  },
};
