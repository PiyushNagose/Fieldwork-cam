import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
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
    website: "",
    identityDocumentUrl: "",
    serviceTypes: [],
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValid = useMemo(
    () =>
      Boolean(
        form.fullName.trim() &&
          form.companyName.trim() &&
          form.email.trim() &&
          form.phone.trim() &&
          form.serviceArea.trim(),
      ),
    [form],
  );

  const handleChange = (key) => (event) => {
    setForm((prev) => ({
      ...prev,
      [key]: event.target.value,
    }));
  };

  const handleToggleService = (service) => {
    setForm((prev) => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(service)
        ? prev.serviceTypes.filter((item) => item !== service)
        : [...prev.serviceTypes, service],
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      const payload = {
        fullName: form.fullName.trim(),
        companyName: form.companyName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        serviceArea: form.serviceArea.trim(),
        address: form.address.trim(),
        taxId: form.taxId.trim(),
        website: form.website.trim(),
        identityDocumentUrl: form.identityDocumentUrl.trim(),
        serviceTypes: form.serviceTypes,
      };

      const res = await createVendorByAdminApi(payload);
      const data = res?.data || res || {};

      navigate("/admin/vendors", {
        replace: true,
        state: {
          vendorCreated: {
            email: payload.email,
            emailDelivery: data?.emailDelivery || null,
          },
        },
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
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
        Create a new vendor profile and send a secure invite email.
      </Typography>

      <Card
        sx={{
          mt: 2.2,
          p: { xs: 2, md: 2.5 },
          borderRadius: 1,
          border: "1px solid #E9E1DB",
          boxShadow: "none",
          bgcolor: "#FFFFFF",
        }}
      >
        <Typography
          sx={{ fontSize: 18, fontWeight: 700, color: "#1F2937", lineHeight: 1.2 }}
        >
          Vendor Details
        </Typography>

        <Typography
          sx={{ mt: 0.55, fontSize: 12.5, color: "#9CA3AF", fontWeight: 500 }}
        >
          The vendor will receive an invite link by email to set their password and open the vendor dashboard.
        </Typography>

        <Box
          sx={{
            mt: 2.2,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
          }}
        >
          <Field
            label="Contact Name *"
            placeholder="e.g., Sarah Kowalski"
            value={form.fullName}
            onChange={handleChange("fullName")}
          />
          <Field
            label="Company Name *"
            placeholder="e.g., Apex Field Co."
            value={form.companyName}
            onChange={handleChange("companyName")}
          />
          <Field
            label="Email Address *"
            placeholder="vendor@company.com"
            value={form.email}
            onChange={handleChange("email")}
          />
          <Field
            label="Phone Number *"
            placeholder="+1 (305) 555-0142"
            value={form.phone}
            onChange={handleChange("phone")}
          />
          <Field
            label="Service Area *"
            placeholder="Miami, FL"
            value={form.serviceArea}
            onChange={handleChange("serviceArea")}
          />
          <Field
            label="Website"
            placeholder="https://company.com"
            value={form.website}
            onChange={handleChange("website")}
          />
          <Field
            label="Address"
            placeholder="Full business address"
            value={form.address}
            onChange={handleChange("address")}
            sx={{ gridColumn: { md: "1 / span 2" } }}
          />
          <Field
            label="Tax ID"
            placeholder="Optional tax identifier"
            value={form.taxId}
            onChange={handleChange("taxId")}
          />
          <Field
            label="Identity Document URL"
            placeholder="Optional document URL"
            value={form.identityDocumentUrl}
            onChange={handleChange("identityDocumentUrl")}
          />
        </Box>

        <Box sx={{ mt: 2.2 }}>
          <Typography sx={sectionLabelSx}>Service Types</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
            {SERVICE_OPTIONS.map((item) => {
              const active = form.serviceTypes.includes(item);
              return (
                <Chip
                  key={item}
                  label={item}
                  onClick={() => handleToggleService(item)}
                  sx={{
                    borderRadius: 1,
                    bgcolor: active ? "#F1DED4" : "#F7F3F0",
                    color: active ? "#4F433B" : "#8F8A84",
                    border: "1px solid #E9E2DC",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                />
              );
            })}
          </Stack>
        </Box>

        <Box sx={{ mt: 2.2 }}>
          <Typography sx={sectionLabelSx}>Notes</Typography>
          <TextField
            fullWidth
            multiline
            minRows={4}
            placeholder="Add any internal notes or comments..."
            value={form.notes}
            onChange={handleChange("notes")}
            sx={fieldSx}
          />
        </Box>

        {error ? (
          <Alert severity="error" sx={{ mt: 2, borderRadius: 1 }}>
            {error}
          </Alert>
        ) : null}

        <Stack
          direction="row"
          justifyContent="flex-end"
          spacing={1.25}
          sx={{ mt: 2.5 }}
        >
          <Button
            variant="outlined"
            onClick={() => navigate("/admin/vendors")}
            sx={secondaryButtonSx}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !isValid}
            sx={primaryButtonSx}
          >
            {loading ? "Creating Vendor..." : "Add Vendor"}
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}

function Field({ sx, ...props }) {
  return <TextField fullWidth size="small" sx={{ ...fieldSx, ...sx }} {...props} />;
}

const sectionLabelSx = {
  fontSize: 13,
  fontWeight: 600,
  color: "#4B5563",
};

const fieldSx = {
  "& .MuiInputLabel-root": {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: 500,
  },
  "& .MuiOutlinedInput-root": {
    borderRadius: 1,
    backgroundColor: "#FFFFFF",
    fontSize: 12.5,
    color: "#374151",
    "& fieldset": {
      borderColor: "#E7E0DA",
    },
    "&:hover fieldset": {
      borderColor: "#DDD4CC",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#D0C0B5",
      borderWidth: "1px",
    },
  },
};

const secondaryButtonSx = {
  minWidth: 120,
  borderRadius: 1,
  borderColor: "#E8E0DA",
  color: "#6B7280",
  textTransform: "none",
  fontSize: 13,
  fontWeight: 600,
  boxShadow: "none",
  "&:hover": {
    borderColor: "#DED4CD",
    bgcolor: "#FCFAF8",
    boxShadow: "none",
  },
};

const primaryButtonSx = {
  minWidth: 140,
  borderRadius: 1,
  bgcolor: "#8D7B72",
  textTransform: "none",
  fontSize: 13,
  fontWeight: 600,
  boxShadow: "none",
  "&:hover": {
    bgcolor: "#7D6B63",
    boxShadow: "none",
  },
};
