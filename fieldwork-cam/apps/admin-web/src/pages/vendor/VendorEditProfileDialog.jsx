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
  BusinessOutlined,
  CloseOutlined,
  EmailOutlined,
  LanguageOutlined,
  LocationOnOutlined,
  PersonOutlineOutlined,
  PhoneOutlined,
  PublicOutlined,
  WorkOutlineOutlined,
  ImageOutlined,
} from "@mui/icons-material";
import { updateVendorProfileApi } from "../../api/vendor.api";

const DEPARTMENTS = [
  "Vendor Operations",
  "Field Operations",
  "Photography",
  "Inspection Services",
  "Project Delivery",
];

const TIMEZONES = [
  "Eastern Time (ET) - UTC-5",
  "Central Time (CT) - UTC-6",
  "Mountain Time (MT) - UTC-7",
  "Pacific Time (PT) - UTC-8",
];

export default function VendorEditProfileDialog({
  open,
  onClose,
  profile,
  onSaved,
}) {
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    website: "",
    serviceArea: "",
    address: "",
    department: "",
    jobTitle: "",
    timezone: "",
    bio: "",
    profilePhotoUrl: "",
    bannerImageUrl: "",
    serviceTypesText: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !profile) return;

    const fullName = profile?.user?.fullName || "";
    const parts = fullName.trim().split(" ").filter(Boolean);

    setForm({
      firstName: profile?.meta?.firstName || parts[0] || "",
      lastName:
        profile?.meta?.lastName ||
        (parts.length > 1 ? parts.slice(1).join(" ") : ""),
      email: profile?.user?.email || "",
      phone: profile?.user?.phone || "",
      companyName: profile?.meta?.companyName || "",
      website: profile?.meta?.website || "",
      serviceArea: profile?.meta?.serviceArea || profile?.user?.location || "",
      address: profile?.meta?.address || "",
      department: profile?.user?.department || profile?.meta?.department || "",
      jobTitle: profile?.user?.jobTitle || profile?.meta?.jobTitle || "",
      timezone: profile?.user?.timezone || profile?.meta?.timezone || "",
      bio: profile?.user?.bio || profile?.meta?.bio || "",
      profilePhotoUrl:
        profile?.user?.profilePhotoUrl || profile?.meta?.profilePhotoUrl || "",
      bannerImageUrl:
        profile?.user?.bannerImageUrl ||
        profile?.meta?.bannerImageUrl ||
        "",
      serviceTypesText: (profile?.meta?.serviceTypes || []).join(", "),
    });

    setError("");
    setTab(0);
  }, [open, profile]);

  const avatarText = useMemo(() => {
    const name = `${form.firstName} ${form.lastName}`.trim();
    const parts = name.split(" ").filter(Boolean);
    if (!parts.length) return "V";
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "V";
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }, [form.firstName, form.lastName]);

  const handleChange = (key) => (event) => {
    setForm((prev) => ({
      ...prev,
      [key]: event.target.value,
    }));
  };

  const handleImageChange = (key) => async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        [key]: String(reader.result || ""),
      }));
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");

      const serviceTypes = form.serviceTypesText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const payload = {
        fullName: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        phone: form.phone,
        companyName: form.companyName,
        website: form.website,
        serviceArea: form.serviceArea,
        location: form.serviceArea,
        address: form.address,
        department: form.department,
        jobTitle: form.jobTitle,
        timezone: form.timezone,
        bio: form.bio,
        profilePhotoUrl: form.profilePhotoUrl.startsWith("data:")
          ? undefined
          : form.profilePhotoUrl,
        profilePhotoDataUrl: form.profilePhotoUrl.startsWith("data:")
          ? form.profilePhotoUrl
          : undefined,
        bannerImageUrl: form.bannerImageUrl.startsWith("data:")
          ? undefined
          : form.bannerImageUrl,
        bannerImageDataUrl: form.bannerImageUrl.startsWith("data:")
          ? form.bannerImageUrl
          : undefined,
        serviceTypes,
        meta: {
          firstName: form.firstName,
          lastName: form.lastName,
          department: form.department,
          jobTitle: form.jobTitle,
          timezone: form.timezone,
          bio: form.bio,
          profilePhotoUrl: form.profilePhotoUrl.startsWith("data:")
            ? undefined
            : form.profilePhotoUrl,
          bannerImageUrl: form.bannerImageUrl.startsWith("data:")
            ? undefined
            : form.bannerImageUrl,
          companyName: form.companyName,
          website: form.website,
          address: form.address,
          serviceArea: form.serviceArea,
          serviceTypes,
        },
      };

      await updateVendorProfileApi(payload);
      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to update vendor profile",
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
          maxWidth: 760,
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 2,
          py: 2,
          borderBottom: "1px solid #F0EBE6",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1F2937" }}>
              Edit Profile
            </Typography>
            <Typography
              sx={{ mt: 0.45, fontSize: 12.5, color: "#9CA3AF", fontWeight: 500 }}
            >
              Update your personal information and preferences.
            </Typography>
          </Box>

          <IconButton onClick={onClose} size="small" sx={{ color: "#9CA3AF" }}>
            <CloseOutlined sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ px: 2, py: 2, borderBottom: "1px solid #F0EBE6" }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              src={form.profilePhotoUrl || ""}
              sx={{
                width: 56,
                height: 56,
                borderRadius: 1,
                bgcolor: "#CBB8AD",
                fontSize: 22,
                fontWeight: 700,
                boxShadow: "0 8px 20px rgba(15, 23, 42, 0.12)",
              }}
            >
              {!form.profilePhotoUrl ? avatarText : null}
            </Avatar>

            <Box>
              <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#374151" }}>
                Profile Photo
              </Typography>
              <Typography
                sx={{ mt: 0.25, fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}
              >
                JPG or PNG. Max 5MB.
              </Typography>
              <Typography
                component="label"
                sx={{
                  mt: 0.7,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "#D88B72",
                  display: "inline-flex",
                  cursor: "pointer",
                }}
              >
                Upload new photo
                <input hidden accept="image/png,image/jpeg,image/webp" type="file" onChange={handleImageChange("profilePhotoUrl")} />
              </Typography>
            </Box>
          </Stack>

          <Box
            sx={{
              mt: 1.6,
              border: "1px dashed #E6DDD7",
              borderRadius: 1,
              overflow: "hidden",
              bgcolor: "#FCFAF8",
            }}
          >
            <Box
              sx={{
                height: 92,
                background: form.bannerImageUrl
                  ? `center / cover no-repeat url(${form.bannerImageUrl})`
                  : "linear-gradient(180deg, rgba(247,247,247,1) 0%, rgba(224,224,224,1) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#B0B5BE",
              }}
            >
              {!form.bannerImageUrl ? <ImageOutlined sx={{ fontSize: 28 }} /> : null}
            </Box>
            <Box sx={{ px: 1.5, py: 1.2 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "#1F2937" }}>
                Banner Image
              </Typography>
              <Typography sx={{ mt: 0.25, fontSize: 11.5, color: "#9CA3AF" }}>
                JPG or PNG. Recommended wide image.
              </Typography>
              <Typography
                component="label"
                sx={{
                  mt: 0.75,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#D88B72",
                  display: "inline-flex",
                  cursor: "pointer",
                }}
              >
                Upload banner
                <input hidden accept="image/png,image/jpeg,image/webp" type="file" onChange={handleImageChange("bannerImageUrl")} />
              </Typography>
            </Box>
          </Box>

          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            sx={{
              mt: 2,
              minHeight: 32,
              "& .MuiTabs-indicator": {
                display: "none",
              },
              "& .MuiTabs-flexContainer": {
                gap: 1,
              },
              "& .MuiTab-root": {
                minHeight: 32,
                borderRadius: 1,
                px: 2,
                py: 0.9,
                textTransform: "none",
                fontSize: 12.5,
                fontWeight: 500,
                color: "#8B8F97",
                bgcolor: "#F5F1EE",
                flex: 1,
                maxWidth: "none",
              },
              "& .Mui-selected": {
                bgcolor: "#FFFFFF",
                color: "#1F2937 !important",
                border: "1px solid #E9E1DB",
                fontWeight: 600,
              },
            }}
          >
            <Tab label="Personal" />
            <Tab label="Work & Bio" />
          </Tabs>
        </Box>

        <Box sx={{ px: 2, py: 2 }}>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}

          {tab === 0 ? (
            <Stack spacing={1.6}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1.5,
                }}
              >
                <Field
                  label="First Name"
                  value={form.firstName}
                  onChange={handleChange("firstName")}
                  icon={<PersonOutlineOutlined sx={{ fontSize: 16 }} />}
                  placeholder="Sarah"
                />
                <Field
                  label="Last Name"
                  value={form.lastName}
                  onChange={handleChange("lastName")}
                  icon={<PersonOutlineOutlined sx={{ fontSize: 16 }} />}
                  placeholder="Kowalski"
                />
              </Box>

              <Field
                label="Email Address"
                value={form.email}
                onChange={handleChange("email")}
                icon={<EmailOutlined sx={{ fontSize: 16 }} />}
                placeholder="sarah.kowalski@lafloridians.com"
              />

              <Field
                label="Phone Number"
                value={form.phone}
                onChange={handleChange("phone")}
                icon={<PhoneOutlined sx={{ fontSize: 16 }} />}
                placeholder="+1 (305) 555-0142"
              />

              <Field
                label="Location"
                value={form.serviceArea}
                onChange={handleChange("serviceArea")}
                icon={<LocationOnOutlined sx={{ fontSize: 16 }} />}
                placeholder="Miami, FL"
              />

              <TextField
                select
                label="Timezone"
                value={form.timezone}
                onChange={handleChange("timezone")}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: iconWrap(<PublicOutlined sx={{ fontSize: 16 }} />),
                }}
                sx={fieldSx}
              >
                {TIMEZONES.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          ) : (
            <Stack spacing={1.6}>
              <Field
                label="Job Title"
                value={form.jobTitle}
                onChange={handleChange("jobTitle")}
                icon={<BadgeOutlined sx={{ fontSize: 16 }} />}
                placeholder="Operations Manager"
              />

              <TextField
                select
                label="Department"
                value={form.department}
                onChange={handleChange("department")}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: iconWrap(
                    <WorkOutlineOutlined sx={{ fontSize: 16 }} />,
                  ),
                }}
                sx={fieldSx}
              >
                {DEPARTMENTS.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>

              <Field
                label="Company Name"
                value={form.companyName}
                onChange={handleChange("companyName")}
                icon={<BusinessOutlined sx={{ fontSize: 16 }} />}
                placeholder="LaFloridians LLC"
              />

              <Field
                label="Website"
                value={form.website}
                onChange={handleChange("website")}
                icon={<LanguageOutlined sx={{ fontSize: 16 }} />}
                placeholder="www.lafloridians.com"
              />

              <Field
                label="Address"
                value={form.address}
                onChange={handleChange("address")}
                icon={<LocationOnOutlined sx={{ fontSize: 16 }} />}
                placeholder="123 Main St, Miami, FL"
              />

              <Field
                label="Specialties"
                value={form.serviceTypesText}
                onChange={handleChange("serviceTypesText")}
                icon={<WorkOutlineOutlined sx={{ fontSize: 16 }} />}
                placeholder="Interior, Commercial, Aerial"
              />

              <TextField
                label="Bio"
                value={form.bio}
                onChange={handleChange("bio")}
                fullWidth
                multiline
                minRows={4}
                placeholder="Tell us about yourself..."
                helperText={`${form.bio.length}/200`}
                sx={multilineFieldSx}
              />

              <Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    color: "#9CA3AF",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    mb: 0.9,
                  }}
                >
                  Preview
                </Typography>

                <Box
                  sx={{
                    minHeight: 78,
                    border: "1px solid #E9E1DB",
                    borderRadius: 1,
                    bgcolor: "#FFFFFF",
                    px: 1.5,
                    py: 1.3,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 12.5,
                      color: form.bio ? "#6B7280" : "#B0B5BE",
                      lineHeight: 1.7,
                      fontWeight: 500,
                    }}
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
            spacing={1}
            sx={{ mt: 2, pt: 0.5 }}
          >
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{
                minWidth: 96,
                minHeight: 32,
                borderRadius: 1,
                borderColor: "#E8E1DA",
                color: "#6B7280",
                fontSize: 12.5,
                fontWeight: 500,
                "&:hover": {
                  borderColor: "#DDD3CB",
                  bgcolor: "#FAF7F4",
                },
              }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading}
              sx={{
                minWidth: 128,
                minHeight: 32,
                borderRadius: 1,
                bgcolor: "#E9CFC2",
                color: "#5F4A40",
                boxShadow: "none",
                fontSize: 12.5,
                fontWeight: 600,
                "&:hover": {
                  bgcolor: "#DFC1B3",
                  boxShadow: "none",
                },
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

function Field({ icon, ...props }) {
  return (
    <TextField
      fullWidth
      size="small"
      InputProps={{
        startAdornment: iconWrap(icon),
      }}
      sx={fieldSx}
      {...props}
    />
  );
}

function iconWrap(icon) {
  return (
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
    bgcolor: "#F9F6F3",
    fontSize: 12.5,
    color: "#374151",
    fontWeight: 500,
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#EFE7E1",
  },
};

const multilineFieldSx = {
  ...fieldSx,
  "& .MuiInputBase-root": {
    minHeight: 112,
    alignItems: "flex-start",
    borderRadius: 1,
    bgcolor: "#F9F6F3",
    fontSize: 12.5,
    color: "#374151",
    fontWeight: 500,
  },
  "& .MuiFormHelperText-root": {
    textAlign: "right",
    fontSize: 11,
    color: "#B0B5BE",
    fontWeight: 500,
    mr: 0,
  },
};
