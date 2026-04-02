import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import {
  BadgeOutlined,
  BusinessCenterOutlined,
  CloseOutlined,
  EmailOutlined,
  LocationOnOutlined,
  PersonOutlineOutlined,
  PhoneOutlined,
  PublicOutlined,
} from "@mui/icons-material";
import { updateAdminProfileApi } from "../../api/admin.api";

const DEPARTMENTS = [
  "Field Operations",
  "Operations",
  "Administration",
  "Finance",
  "Support",
  "Analytics",
];

const TIMEZONES = [
  "Eastern Time (ET) — UTC-5",
  "Central Time (CT) — UTC-6",
  "Mountain Time (MT) — UTC-7",
  "Pacific Time (PT) — UTC-8",
];

export default function EditProfileDialog({ open, onClose, profile, onSaved }) {
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    timezone: "",
    jobTitle: "",
    department: "",
    bio: "",
    profilePhotoUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile) return;

    const user = profile?.user || profile || {};
    const meta = profile?.meta || user?.meta || {};
    const fullName = user?.fullName || "";
    const parts = fullName.trim().split(" ").filter(Boolean);

    setForm({
      firstName: meta?.firstName || parts[0] || "",
      lastName: meta?.lastName || (parts.length > 1 ? parts.slice(1).join(" ") : ""),
      email: user?.email || "",
      phone: user?.phone || "",
      location: user?.location || meta?.location || "",
      timezone: user?.timezone || meta?.timezone || "",
      jobTitle: user?.jobTitle || meta?.jobTitle || "",
      department: user?.department || meta?.department || "",
      bio: user?.bio || meta?.bio || "",
      profilePhotoUrl: user?.profilePhotoUrl || meta?.profilePhotoUrl || "",
    });
  }, [profile, open]);

  const avatarText = useMemo(() => {
    const name = `${form.firstName} ${form.lastName}`.trim();
    const parts = name.split(" ").filter(Boolean);
    if (!parts.length) return "A";
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "A";
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }, [form.firstName, form.lastName]);

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      const payload = {
        fullName: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        phone: form.phone,
        location: form.location,
        timezone: form.timezone,
        department: form.department,
        jobTitle: form.jobTitle,
        bio: form.bio,
        profilePhotoUrl: form.profilePhotoUrl,
        meta: {
          firstName: form.firstName,
          lastName: form.lastName,
          location: form.location,
          timezone: form.timezone,
          department: form.department,
          jobTitle: form.jobTitle,
          bio: form.bio,
          profilePhotoUrl: form.profilePhotoUrl,
        },
      };

      const response = await updateAdminProfileApi(payload);
      const data = response?.data || response;

      onSaved?.(data);
      onClose?.();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update profile",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          maxWidth: 540,
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 2.5,
          py: 2,
          borderBottom: "1px solid #F0EBE6",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#1F2937" }}>
              Edit Profile
            </Typography>
            <Typography sx={{ mt: 0.45, fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>
              Update your personal information and preferences.
            </Typography>
          </Box>

          <IconButton onClick={onClose} sx={{ color: "#9CA3AF" }}>
            <CloseOutlined sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ px: 2.5, py: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              src={form.profilePhotoUrl || ""}
              sx={{
                width: 52,
                height: 52,
                borderRadius: 1.3,
                bgcolor: "#CBB8AD",
                fontSize: 18,
                fontWeight: 800,
                boxShadow: "0 8px 18px rgba(31,41,55,0.08)",
              }}
            >
              {!form.profilePhotoUrl ? avatarText : null}
            </Avatar>

            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#1F2937" }}>
                Profile Photo
              </Typography>
              <Typography sx={{ mt: 0.2, fontSize: 11.25, color: "#A39D96" }}>
                JPG or PNG. Max 5MB.
              </Typography>
              <Typography
                sx={{
                  mt: 0.8,
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "#D88B72",
                }}
              >
                Upload new photo
              </Typography>
            </Box>
          </Stack>

          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            sx={{
              mt: 1.8,
              minHeight: 38,
              bgcolor: "#F7F4F1",
              p: 0.35,
              borderRadius: 1,
              "& .MuiTabs-indicator": { display: "none" },
              "& .MuiTab-root": {
                minHeight: 30,
                minWidth: 0,
                flex: 1,
                textTransform: "none",
                fontWeight: 600,
                fontSize: 11,
                borderRadius: 0.9,
                color: "#8F8A84",
              },
              "& .Mui-selected": {
                bgcolor: "#FFFFFF",
                color: "#1F2937 !important",
                boxShadow: "0 1px 2px rgba(31,41,55,0.06)",
              },
            }}
          >
            <Tab label="Personal" />
            <Tab label="Work & Bio" />
          </Tabs>
        </Box>

        <Box sx={{ px: 2.5, pb: 2.3 }}>
          {error ? (
            <Alert severity="error" sx={{ mb: 1.5, borderRadius: 1 }}>
              {error}
            </Alert>
          ) : null}

          {tab === 0 ? (
            <Stack spacing={1.5}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 1.35,
                }}
              >
                <ProfileField
                  label="First Name"
                  value={form.firstName}
                  onChange={handleChange("firstName")}
                  icon={<PersonOutlineOutlined sx={{ fontSize: 16 }} />}
                />
                <ProfileField
                  label="Last Name"
                  value={form.lastName}
                  onChange={handleChange("lastName")}
                  icon={<PersonOutlineOutlined sx={{ fontSize: 16 }} />}
                />
              </Box>

              <ProfileField
                label="Email Address"
                value={form.email}
                onChange={handleChange("email")}
                icon={<EmailOutlined sx={{ fontSize: 16 }} />}
              />
              <ProfileField
                label="Phone Number"
                value={form.phone}
                onChange={handleChange("phone")}
                icon={<PhoneOutlined sx={{ fontSize: 16 }} />}
              />
              <ProfileField
                label="Location"
                value={form.location}
                onChange={handleChange("location")}
                icon={<LocationOnOutlined sx={{ fontSize: 16 }} />}
              />

              <TextField
                select
                label="Timezone"
                value={form.timezone}
                onChange={handleChange("timezone")}
                fullWidth
                size="small"
                sx={fieldSx}
                InputProps={{
                  startAdornment: (
                    <Box sx={startAdornmentSx}>
                      <PublicOutlined sx={{ fontSize: 16 }} />
                    </Box>
                  ),
                }}
              >
                {TIMEZONES.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              <ProfileField
                label="Job Title"
                value={form.jobTitle}
                onChange={handleChange("jobTitle")}
                icon={<BadgeOutlined sx={{ fontSize: 16 }} />}
              />

              <TextField
                select
                label="Department"
                value={form.department}
                onChange={handleChange("department")}
                fullWidth
                size="small"
                sx={fieldSx}
                InputProps={{
                  startAdornment: (
                    <Box sx={startAdornmentSx}>
                      <BusinessCenterOutlined sx={{ fontSize: 16 }} />
                    </Box>
                  ),
                }}
              >
                {DEPARTMENTS.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Bio"
                value={form.bio}
                onChange={handleChange("bio")}
                fullWidth
                multiline
                minRows={5}
                placeholder="Tell us about yourself..."
                sx={multilineFieldSx}
                helperText={`${Math.min(form.bio.length, 200)}/200`}
                inputProps={{ maxLength: 200 }}
                FormHelperTextProps={{
                  sx: {
                    textAlign: "right",
                    color: "#B0B5BE",
                    fontSize: 10.5,
                    mt: 0.5,
                  },
                }}
              />

              <Box>
                <Typography
                  sx={{
                    fontSize: 10.5,
                    color: "#A39D96",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    mb: 0.8,
                    letterSpacing: "0.08em",
                  }}
                >
                  Preview
                </Typography>

                <Box
                  sx={{
                    border: "1px solid #EDE7E1",
                    borderRadius: 1,
                    p: 1.5,
                    bgcolor: "#FCFAF8",
                  }}
                >
                  <Typography sx={{ fontSize: 12.5, color: "#6B7280", lineHeight: 1.7 }}>
                    {form.bio || "No bio preview available."}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          )}

          <Stack direction="row" justifyContent="flex-end" spacing={1.2} sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={onClose} sx={cancelButtonSx}>
              Cancel
            </Button>

            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              sx={saveButtonSx}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function ProfileField({ label, value, onChange, icon }) {
  return (
    <TextField
      label={label}
      value={value}
      onChange={onChange}
      fullWidth
      size="small"
      sx={fieldSx}
      InputProps={{
        startAdornment: <Box sx={startAdornmentSx}>{icon}</Box>,
      }}
    />
  );
}

const fieldSx = {
  "& .MuiInputLabel-root": {
    fontSize: 11.5,
    color: "#9CA3AF",
    fontWeight: 500,
  },
  "& .MuiInputBase-root": {
    minHeight: 40,
    borderRadius: 1,
    bgcolor: "#FBF8F6",
    fontSize: 12.5,
    color: "#374151",
    fontWeight: 500,
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#E6DDD7",
  },
  "& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#DDD4CC",
  },
  "& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#D5C6BA",
    borderWidth: "1px",
  },
};

const multilineFieldSx = {
  ...fieldSx,
  "& .MuiInputBase-root": {
    minHeight: 126,
    alignItems: "flex-start",
    borderRadius: 1,
    bgcolor: "#FBF8F6",
    fontSize: 12.5,
    color: "#374151",
    fontWeight: 500,
  },
};

const startAdornmentSx = {
  mr: 1,
  display: "flex",
  alignItems: "center",
  color: "#B0B5BE",
};

const cancelButtonSx = {
  minWidth: 92,
  borderRadius: 1,
  borderColor: "#E8E1DA",
  color: "#6B7280",
  textTransform: "none",
  fontSize: 12,
  fontWeight: 600,
  boxShadow: "none",
  "&:hover": {
    borderColor: "#DED3CB",
    bgcolor: "#FCFAF8",
    boxShadow: "none",
  },
};

const saveButtonSx = {
  minWidth: 132,
  borderRadius: 1,
  bgcolor: "#D8BAA9",
  color: "#1F2937",
  textTransform: "none",
  fontSize: 12,
  fontWeight: 700,
  boxShadow: "none",
  "&:hover": {
    bgcolor: "#CBA895",
    boxShadow: "none",
  },
  "&.Mui-disabled": {
    bgcolor: "#E6DDD8",
    color: "#948C87",
  },
};
