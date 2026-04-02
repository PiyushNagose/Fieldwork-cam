import React, { useState } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  Typography,
  Stack,
  OutlinedInput,
  Button,
  Chip,
} from "@mui/material";
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

export default function AddStaffModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    roleTitle: "",
    status: "ACTIVE",
    profilePhotoUrl: "",
    email: "",
    phone: "",
    location: "",
    specialties: [],
    inviteMethod: "SMS",
  });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSpecialty = (sp) => {
    setForm((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(sp)
        ? prev.specialties.filter((s) => s !== sp)
        : [...prev.specialties, sp],
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await createStaffApi(form);
      onSuccess?.();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent sx={{ p: 3 }}>
        {/* HEADER */}
        <Typography sx={{ fontSize: 20, fontWeight: 700 }}>
          Add New Staff Member
        </Typography>

        <Typography sx={{ fontSize: 13, color: "#9CA3AF", mt: 0.5 }}>
          Fill in the details to add a new team member
        </Typography>

        {/* PERSONAL INFO */}
        <Typography sx={{ mt: 2, fontSize: 14, fontWeight: 600 }}>
          Personal Information
        </Typography>

        <Stack spacing={1.5} sx={{ mt: 1.5 }}>
          <OutlinedInput
            placeholder="Full Name"
            value={form.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
          />

          <OutlinedInput
            placeholder="Role"
            value={form.roleTitle}
            onChange={(e) => handleChange("roleTitle", e.target.value)}
          />

          <Stack direction="row" spacing={1}>
            <OutlinedInput
              fullWidth
              placeholder="Status"
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
            />

            <OutlinedInput
              fullWidth
              placeholder="Profile Photo URL"
              value={form.profilePhotoUrl}
              onChange={(e) => handleChange("profilePhotoUrl", e.target.value)}
            />
          </Stack>
        </Stack>

        {/* CONTACT */}
        <Typography sx={{ mt: 2, fontSize: 14, fontWeight: 600 }}>
          Contact Information
        </Typography>

        <Stack spacing={1.5} sx={{ mt: 1.5 }}>
          <OutlinedInput
            placeholder="Email Address"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
          />

          <Stack direction="row" spacing={1}>
            <OutlinedInput
              fullWidth
              placeholder="Phone Number"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />

            <OutlinedInput
              fullWidth
              placeholder="Location"
              value={form.location}
              onChange={(e) => handleChange("location", e.target.value)}
            />
          </Stack>
        </Stack>

        {/* SPECIALTIES */}
        <Typography sx={{ mt: 2, fontSize: 14, fontWeight: 600 }}>
          Specialties
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 1.5, flexWrap: "wrap", gap: 1 }}
        >
          {SPECIALTIES.map((sp) => {
            const selected = form.specialties.includes(sp);
            return (
              <Chip
                key={sp}
                label={sp}
                onClick={() => toggleSpecialty(sp)}
                sx={{
                  fontSize: 12,
                  bgcolor: selected ? "#1F2937" : "#F3F4F6",
                  color: selected ? "#fff" : "#374151",
                }}
              />
            );
          })}
        </Stack>

        {/* ACTIONS */}
        <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={onClose}
            sx={{ height: 40 }}
          >
            Cancel
          </Button>

          <Button
            fullWidth
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              height: 40,
              bgcolor: "#CBB8AD",
              color: "#000",
              boxShadow: "none",
            }}
          >
            {loading ? "Adding..." : "Add Staff Member"}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
