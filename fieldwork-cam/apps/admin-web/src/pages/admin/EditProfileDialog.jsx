import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Avatar,
  MenuItem,
  Alert,
} from "@mui/material";
import {
  CloseOutlined,
  PersonOutlineOutlined,
  EmailOutlined,
  PhoneOutlined,
  LocationOnOutlined,
  PublicOutlined,
  BusinessCenterOutlined,
  BadgeOutlined,
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile) return;

    const fullName = profile?.user?.fullName || "";
    const parts = fullName.trim().split(" ").filter(Boolean);

    setForm({
      firstName: profile?.meta?.firstName || parts[0] || "",
      lastName:
        profile?.meta?.lastName ||
        (parts.length > 1 ? parts.slice(1).join(" ") : ""),
      email: profile?.user?.email || "",
      phone: profile?.user?.phone || "",
      location: profile?.user?.location || profile?.meta?.location || "",
      timezone: profile?.user?.timezone || profile?.meta?.timezone || "",
      jobTitle: profile?.meta?.jobTitle || profile?.user?.jobTitle || "",
      department: profile?.user?.department || profile?.meta?.department || "",
      bio: profile?.meta?.bio || profile?.user?.bio || "",
      profilePhotoUrl:
        profile?.user?.profilePhotoUrl || profile?.meta?.profilePhotoUrl || "",
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
    setForm((prev) => ({
      ...prev,
      [key]: event.target.value,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
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

      const res = await updateAdminProfileApi(payload);
      const data = res?.data || res;

      onSaved?.(data);
      onClose?.();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update profile",
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
          borderRadius: 3,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          py: 2.5,
          borderBottom: "1px solid #F0EBE6",
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box>
            <Typography
              sx={{ fontSize: 22, fontWeight: 700, color: "#111827" }}
            >
              Edit Profile
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: 14, color: "#9CA3AF" }}>
              Update your personal information and preferences.
            </Typography>
          </Box>

          <IconButton onClick={onClose}>
            <CloseOutlined />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ px: 3, py: 2.5, borderBottom: "1px solid #F0EBE6" }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={form.profilePhotoUrl || ""}
              sx={{
                width: 96,
                height: 96,
                borderRadius: 2,
                bgcolor: "#CBB8AD",
                fontSize: 28,
                fontWeight: 800,
              }}
            >
              {!form.profilePhotoUrl ? avatarText : null}
            </Avatar>

            <Box>
              <Typography
                sx={{ fontSize: 16, fontWeight: 700, color: "#111827" }}
              >
                Profile Photo
              </Typography>
              <Typography sx={{ mt: 0.3, fontSize: 13, color: "#9CA3AF" }}>
                JPG or PNG. Max 5MB.
              </Typography>
              <Typography
                sx={{
                  mt: 1.1,
                  fontSize: 14,
                  fontWeight: 700,
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
              mt: 3,
              minHeight: 42,
              "& .MuiTabs-indicator": {
                display: "none",
              },
              "& .MuiTab-root": {
                minHeight: 42,
                borderRadius: 1.5,
                textTransform: "none",
                fontWeight: 700,
                color: "#6B7280",
                bgcolor: "#F7F4F1",
                mr: 1.5,
                minWidth: 180,
              },
              "& .Mui-selected": {
                bgcolor: "#fff",
                color: "#111827 !important",
                border: "1px solid #EDE7E1",
              },
            }}
          >
            <Tab label="Personal" />
            <Tab label="Work & Bio" />
          </Tabs>
        </Box>

        <Box sx={{ px: 3, py: 3 }}>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}

          {tab === 0 ? (
            <Stack spacing={2.2}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 2,
                }}
              >
                <TextField
                  label="First Name"
                  value={form.firstName}
                  onChange={handleChange("firstName")}
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <Box
                        sx={{
                          mr: 1,
                          display: "flex",
                          alignItems: "center",
                          color: "#B0B5BE",
                        }}
                      >
                        <PersonOutlineOutlined sx={{ fontSize: 18 }} />
                      </Box>
                    ),
                  }}
                />

                <TextField
                  label="Last Name"
                  value={form.lastName}
                  onChange={handleChange("lastName")}
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <Box
                        sx={{
                          mr: 1,
                          display: "flex",
                          alignItems: "center",
                          color: "#B0B5BE",
                        }}
                      >
                        <PersonOutlineOutlined sx={{ fontSize: 18 }} />
                      </Box>
                    ),
                  }}
                />
              </Box>

              <TextField
                label="Email Address"
                value={form.email}
                onChange={handleChange("email")}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <Box
                      sx={{
                        mr: 1,
                        display: "flex",
                        alignItems: "center",
                        color: "#B0B5BE",
                      }}
                    >
                      <EmailOutlined sx={{ fontSize: 18 }} />
                    </Box>
                  ),
                }}
              />

              <TextField
                label="Phone Number"
                value={form.phone}
                onChange={handleChange("phone")}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <Box
                      sx={{
                        mr: 1,
                        display: "flex",
                        alignItems: "center",
                        color: "#B0B5BE",
                      }}
                    >
                      <PhoneOutlined sx={{ fontSize: 18 }} />
                    </Box>
                  ),
                }}
              />

              <TextField
                label="Location"
                value={form.location}
                onChange={handleChange("location")}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <Box
                      sx={{
                        mr: 1,
                        display: "flex",
                        alignItems: "center",
                        color: "#B0B5BE",
                      }}
                    >
                      <LocationOnOutlined sx={{ fontSize: 18 }} />
                    </Box>
                  ),
                }}
              />

              <TextField
                select
                label="Timezone"
                value={form.timezone}
                onChange={handleChange("timezone")}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <Box
                      sx={{
                        mr: 1,
                        display: "flex",
                        alignItems: "center",
                        color: "#B0B5BE",
                      }}
                    >
                      <PublicOutlined sx={{ fontSize: 18 }} />
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
            <Stack spacing={2.2}>
              <TextField
                label="Job Title"
                value={form.jobTitle}
                onChange={handleChange("jobTitle")}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <Box
                      sx={{
                        mr: 1,
                        display: "flex",
                        alignItems: "center",
                        color: "#B0B5BE",
                      }}
                    >
                      <BadgeOutlined sx={{ fontSize: 18 }} />
                    </Box>
                  ),
                }}
              />

              <TextField
                select
                label="Department"
                value={form.department}
                onChange={handleChange("department")}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <Box
                      sx={{
                        mr: 1,
                        display: "flex",
                        alignItems: "center",
                        color: "#B0B5BE",
                      }}
                    >
                      <BusinessCenterOutlined sx={{ fontSize: 18 }} />
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
                minRows={6}
                placeholder="Tell us about yourself..."
              />

              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    color: "#9CA3AF",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    mb: 1,
                  }}
                >
                  Preview
                </Typography>

                <Box
                  sx={{
                    border: "1px solid #EDE7E1",
                    borderRadius: 1.5,
                    p: 2,
                    bgcolor: "#FCFAF8",
                  }}
                >
                  <Typography
                    sx={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7 }}
                  >
                    {form.bio || "No bio preview available."}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          )}

          <Stack
            direction="row"
            justifyContent="flex-end"
            spacing={1.5}
            sx={{ mt: 3 }}
          >
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{
                minWidth: 120,
                borderRadius: 1.5,
                borderColor: "#E8E1DA",
                color: "#6B7280",
              }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading}
              sx={{
                minWidth: 170,
                borderRadius: 1.5,
                bgcolor: "#EFD9CE",
                color: "#111827",
                boxShadow: "none",
                "&:hover": { bgcolor: "#E4CEC3", boxShadow: "none" },
              }}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
