import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { createVendorByAdminApi } from "../../api/vendor.api";

const SERVICE_OPTIONS = [
  "Site Inspection",
  "Property Survey",
  "Progress Documentation",
  "Final Inspection",
  "Aerial Mapping",
  "Commercial",
  "Residential",
];

export default function AddVendorPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    companyName: "",
    email: "",
    phone: "",
    serviceArea: "",
    address: "",
    taxId: "",
    identityDocumentUrl: "",
    serviceTypes: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (key) => (event) => {
    setForm((prev) => ({
      ...prev,
      [key]: event.target.value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      await createVendorByAdminApi(form);
      navigate("/admin/vendors");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create vendor",
      );
    } finally {
      setLoading(false);
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
      {/* Page Header */}
      <Typography
        sx={{
          fontSize: 28,
          fontWeight: 700,
          color: "#1F2937",
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
        }}
      >
        Add New Vendor
      </Typography>

      <Typography
        sx={{
          mt: 0.5,
          color: "#9CA3AF",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        Create a new vendor to assign projects.
      </Typography>

      {/* Form Card */}
      <Card
        sx={{
          mt: 2.25,
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
            mb: 2,
          }}
        >
          Vendor Details
        </Typography>

        {/* Form Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
          }}
        >
          {/* Input Fields */}
          <TextField
            label="Full Name"
            value={form.fullName}
            onChange={handleChange("fullName")}
            fullWidth
            size="small"
            sx={{ marginBottom: 1.5 }}
          />

          <TextField
            label="Company Name"
            value={form.companyName}
            onChange={handleChange("companyName")}
            fullWidth
            size="small"
            sx={{ marginBottom: 1.5 }}
          />

          <TextField
            label="Email"
            value={form.email}
            onChange={handleChange("email")}
            fullWidth
            size="small"
            sx={{ marginBottom: 1.5 }}
          />

          <TextField
            label="Phone"
            value={form.phone}
            onChange={handleChange("phone")}
            fullWidth
            size="small"
            sx={{ marginBottom: 1.5 }}
          />

          <TextField
            label="Service Area"
            value={form.serviceArea}
            onChange={handleChange("serviceArea")}
            fullWidth
            size="small"
            sx={{ marginBottom: 1.5 }}
          />

          <TextField
            label="Tax ID"
            value={form.taxId}
            onChange={handleChange("taxId")}
            fullWidth
            size="small"
            sx={{ marginBottom: 1.5 }}
          />

          <TextField
            label="Address"
            value={form.address}
            onChange={handleChange("address")}
            fullWidth
            size="small"
            sx={{ gridColumn: { md: "1 / span 2" }, marginBottom: 1.5 }}
          />

          <TextField
            label="Identity Document URL"
            value={form.identityDocumentUrl}
            onChange={handleChange("identityDocumentUrl")}
            fullWidth
            size="small"
            sx={{ gridColumn: { md: "1 / span 2" }, marginBottom: 1.5 }}
          />

          <TextField
            select
            label="Service Types"
            value=""
            onChange={(e) => {
              const value = e.target.value;
              if (!value || form.serviceTypes.includes(value)) return;
              setForm((prev) => ({
                ...prev,
                serviceTypes: [...prev.serviceTypes, value],
              }));
            }}
            fullWidth
            size="small"
            sx={{ gridColumn: { md: "1 / span 2" }, marginBottom: 1.5 }}
          >
            {SERVICE_OPTIONS.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Service Types Chips */}
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
          {form.serviceTypes.map((item) => (
            <Chip
              key={item}
              label={item}
              onDelete={() =>
                setForm((prev) => ({
                  ...prev,
                  serviceTypes: prev.serviceTypes.filter((x) => x !== item),
                }))
              }
              sx={{
                borderRadius: 1,
                bgcolor: "#F8F5F1",
                color: "#6B7280",
                fontSize: 12,
                mb: 0.5,
              }}
            />
          ))}
        </Stack>

        {error ? (
          <Alert severity="error" sx={{ mt: 2, borderRadius: 1 }}>
            {error}
          </Alert>
        ) : null}

        {/* Footer Actions */}
        <Stack
          direction="row"
          justifyContent="flex-end"
          spacing={1.5}
          sx={{ mt: 2.5 }}
        >
          <Button
            variant="text"
            onClick={() => navigate("/admin/vendors")}
            sx={{
              borderRadius: 1,
              color: "#6B7280",
              textTransform: "none",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              borderRadius: 1,
              minWidth: 120,
              bgcolor: "#8D7B72",
              textTransform: "none",
              fontSize: 13,
              fontWeight: 600,
              boxShadow: "none",
              "&:hover": { bgcolor: "#7D6B63", boxShadow: "none" },
            }}
          >
            {loading ? "Creating..." : "Add Vendor"}
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}
