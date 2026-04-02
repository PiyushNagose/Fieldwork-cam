import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  CloseOutlined,
  EmailOutlined,
  LocationOnOutlined,
  PersonOutlineOutlined,
  PhoneOutlined,
} from "@mui/icons-material";
import { createStaffApi } from "../../api/staff.api";

const SPECIALTIES = [
  "Interior",
  "Commercial",
  "Aerial",
  "Residential",
  "Exterior",
  "Parking",
  "Solar",
  "Industrial",
  "Warehouse",
  "Roof Survey",
  "Foundation",
];

const ROLE_OPTIONS = [
  "Field Photographer",
  "Senior Photographer",
  "Junior Photographer",
  "Drone Operator",
  "Site Inspector",
];

const STATUS_OPTIONS = ["ACTIVE", "ON_LEAVE", "INACTIVE"];

export default function AddStaffModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    roleTitle: "",
    status: "ACTIVE",
    profilePhotoUrl: "",
    email: "",
    phone: "",
    location: "",
    specialties: [],
    inviteMethod: "EMAIL",
  });

  const handleChange = (key) => (event) => {
    setForm((prev) => ({
      ...prev,
      [key]: event.target.value,
    }));
  };

  const toggleSpecialty = (specialty) => {
    setForm((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter((item) => item !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  const resetForm = () => {
    setForm({
      fullName: "",
      roleTitle: "",
      status: "ACTIVE",
      profilePhotoUrl: "",
      email: "",
      phone: "",
      location: "",
      specialties: [],
      inviteMethod: "EMAIL",
    });
    setError("");
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      await createStaffApi(form);
      onSuccess?.();
      onClose?.();
      resetForm();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to add staff member",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
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
              Add New Staff Member
            </Typography>
            <Typography
              sx={{ mt: 0.45, fontSize: 12.5, color: "#9CA3AF", fontWeight: 500 }}
            >
              Fill in the details to add a new team member
            </Typography>
          </Box>

          <IconButton onClick={onClose} size="small" sx={{ color: "#9CA3AF" }}>
            <CloseOutlined sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 2, py: 2 }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 1.5, borderRadius: 1 }}>
            {error}
          </Alert>
        ) : null}

        <SectionTitle title="Personal Information" />
        <Stack spacing={1.5}>
          <Field
            label="Full Name *"
            value={form.fullName}
            onChange={handleChange("fullName")}
            placeholder="e.g., John Smith"
            icon={<PersonOutlineOutlined sx={{ fontSize: 16 }} />}
          />

          <TextField
            select
            label="Role *"
            value={form.roleTitle}
            onChange={handleChange("roleTitle")}
            fullWidth
            size="small"
            sx={fieldSx}
          >
            {ROLE_OPTIONS.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </TextField>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 1.5,
            }}
          >
            <TextField
              select
              label="Status"
              value={form.status}
              onChange={handleChange("status")}
              fullWidth
              size="small"
              sx={fieldSx}
            >
              {STATUS_OPTIONS.map((item) => (
                <MenuItem key={item} value={item}>
                  {item.replace("_", " ")}
                </MenuItem>
              ))}
            </TextField>

            <Field
              label="Profile Photo"
              value={form.profilePhotoUrl}
              onChange={handleChange("profilePhotoUrl")}
              placeholder="https://..."
            />
          </Box>
        </Stack>

        <SectionTitle title="Contact Information" sx={{ mt: 2 }} />
        <Stack spacing={1.5}>
          <Field
            label="Email Address *"
            value={form.email}
            onChange={handleChange("email")}
            placeholder="john.smith@fieldworkcam.co"
            icon={<EmailOutlined sx={{ fontSize: 16 }} />}
          />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 1.5,
            }}
          >
            <Field
              label="Phone Number *"
              value={form.phone}
              onChange={handleChange("phone")}
              placeholder="(555) 123-4567"
              icon={<PhoneOutlined sx={{ fontSize: 16 }} />}
            />

            <Field
              label="Location *"
              value={form.location}
              onChange={handleChange("location")}
              placeholder="Austin, TX"
              icon={<LocationOnOutlined sx={{ fontSize: 16 }} />}
            />
          </Box>
        </Stack>

        <SectionTitle title="Specialties" sx={{ mt: 2 }} />
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
          {SPECIALTIES.map((item) => {
            const selected = form.specialties.includes(item);
            return (
              <Button
                key={item}
                onClick={() => toggleSpecialty(item)}
                sx={{
                  minHeight: 28,
                  px: 1.1,
                  borderRadius: 999,
                  border: "1px solid #E6EBF1",
                  bgcolor: selected ? "#EAF3FF" : "#F5F7FA",
                  color: selected ? "#2563EB" : "#4B5563",
                  fontSize: 12,
                  fontWeight: 500,
                  textTransform: "none",
                  "&:hover": {
                    bgcolor: selected ? "#EAF3FF" : "#EEF2F6",
                  },
                }}
              >
                {item}
              </Button>
            );
          })}
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 2.5, pt: 1, borderTop: "1px solid #F0EBE6" }}
        >
          <Button
            fullWidth
            variant="outlined"
            onClick={onClose}
            sx={{
              minHeight: 40,
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
            fullWidth
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              minHeight: 40,
              borderRadius: 1,
              bgcolor: "#EFD9CE",
              color: "#111827",
              boxShadow: "0 10px 22px rgba(201, 180, 168, 0.28)",
              fontSize: 12.5,
              fontWeight: 600,
              "&:hover": {
                bgcolor: "#E4CEC3",
                boxShadow: "0 10px 22px rgba(201, 180, 168, 0.28)",
              },
            }}
          >
            {loading ? "Adding..." : "Add Staff Member"}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function SectionTitle({ title, sx }) {
  return (
    <Typography
      sx={{
        mt: 0.5,
        mb: 1.3,
        fontSize: 14,
        fontWeight: 700,
        color: "#1F2937",
        ...sx,
      }}
    >
      {title}
    </Typography>
  );
}

function Field({ icon, ...props }) {
  return (
    <TextField
      fullWidth
      size="small"
      InputProps={{
        startAdornment: icon ? (
          <Box
            sx={{
              mr: 0.9,
              color: "#B0B5BE",
              display: "flex",
              alignItems: "center",
            }}
          >
            {icon}
          </Box>
        ) : null,
      }}
      sx={fieldSx}
      {...props}
    />
  );
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
