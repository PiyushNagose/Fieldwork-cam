import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import {
  EmailOutlined,
  PhoneOutlined,
  LocationOnOutlined,
  BusinessCenterOutlined,
  PublicOutlined,
  CalendarMonthOutlined,
  AccessTimeOutlined,
  ShieldOutlined,
  EditOutlined,
} from "@mui/icons-material";
import { getVendorProfileByAuthUserIdApi } from "../../api/vendor.api"; // Update to vendor API
import VendorEditProfileDialog from "../../pages/vendor/VendorEditProfileDialog"; // Edit profile component

export default function VendorProfilePage() {
  const [tab, setTab] = useState(0);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openEdit, setOpenEdit] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getVendorProfileByAuthUserIdApi(); // API call for vendor profile
      const data = res?.data || res || null;
      setProfile(data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load profile",
      );
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const user = useMemo(() => profile?.user || profile || {}, [profile]);
  const meta = useMemo(() => profile?.meta || {}, [profile]);
  const activity = useMemo(() => profile?.recentActivity || [], [profile]);

  const fullName = user?.fullName || "Vendor User";
  const email = user?.email || "—";
  const phone = user?.phone || "—";
  const location = user?.location || meta?.location || "—";
  const department = user?.department || meta?.department || "—";
  const timezone = user?.timezone || meta?.timezone || "—";
  const joinedAt = user?.createdAt || meta?.memberSince || "";
  const lastLogin = meta?.lastLogin || user?.lastLogin || "";
  const status = user?.status || "ACTIVE";
  const role = user?.role || "VENDOR";
  const jobTitle = meta?.jobTitle || user?.jobTitle || "Vendor Partner";
  const approvalRate = meta?.approvalRate ?? 0;
  const totalProjects = meta?.totalProjects ?? 0;
  const totalCompleted = meta?.totalCompleted ?? 0;
  const avatarUrl = user?.profilePhotoUrl || meta?.profilePhotoUrl || "";

  const initials = (value = "") => {
    const parts = value.trim().split(" ").filter(Boolean);
    if (!parts.length) return "A";
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "A";
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  };

  const statusChip = (value = "") => {
    const map = {
      ACTIVE: { bg: "#EAFBF1", color: "#22C55E", label: "Active" },
      INACTIVE: { bg: "#F3F4F6", color: "#6B7280", label: "Inactive" },
      SUSPENDED: { bg: "#FEE2E2", color: "#DC2626", label: "Suspended" },
    };

    const current = map[value] || {
      bg: "#F3F4F6",
      color: "#6B7280",
      label: value || "—",
    };

    return (
      <Chip
        label={current.label}
        size="small"
        sx={{
          bgcolor: current.bg,
          color: current.color,
          fontWeight: 700,
          borderRadius: 1,
          height: 24,
        }}
      />
    );
  };

  if (loading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: 320 }}
        spacing={2}
      >
        <CircularProgress />
        <Typography color="text.secondary">Loading profile...</Typography>
      </Stack>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box
      sx={{
        px: { xs: 1.5, md: 2 },
        py: { xs: 1.5, md: 2 },
        bgcolor: "#F8F5F2",
        minHeight: "100vh",
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
        Profile
      </Typography>
      <Typography
        sx={{ mt: 0.5, color: "#9CA3AF", fontSize: 13, fontWeight: 500 }}
      >
        Manage your account settings and preferences.
      </Typography>

      <Card
        sx={{
          mt: 3,
          borderRadius: 1,
          border: "1px solid #EDE7E1",
          boxShadow: "none",
          overflow: "hidden",
        }}
      >
        <Box sx={{ height: 96, bgcolor: "#F7F0EB" }} />

        <Box sx={{ px: 3, pb: 3 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mt: -4 }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                src={avatarUrl}
                sx={{
                  width: 90,
                  height: 90,
                  bgcolor: "#CBB8AD",
                  fontSize: 28,
                  fontWeight: 800,
                  border: "4px solid white",
                }}
              >
                {!avatarUrl ? initials(fullName) : null}
              </Avatar>

              <Box sx={{ pt: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography
                    sx={{ fontSize: 22, fontWeight: 800, color: "#111827" }}
                  >
                    {fullName}
                  </Typography>
                  <Chip
                    label={role}
                    size="small"
                    sx={{
                      height: 24,
                      borderRadius: 1,
                      bgcolor: "#EAFBF1",
                      color: "#22C55E",
                      fontWeight: 700,
                    }}
                  />
                </Stack>

                <Typography sx={{ mt: 0.5, fontSize: 14, color: "#6B7280" }}>
                  {jobTitle}
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="contained"
              startIcon={<EditOutlined />}
              onClick={() => setOpenEdit(true)}
              sx={{
                borderRadius: 1,
                bgcolor: "#EFD9CE",
                color: "#111827",
                boxShadow: "none",
                "&:hover": { bgcolor: "#E4CEC3", boxShadow: "none" },
              }}
            >
              Edit Profile
            </Button>
          </Stack>

          <Box
            sx={{
              mt: 3,
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 1.5,
              maxWidth: 520,
            }}
          >
            <MiniStat value={totalProjects} label="Projects" />
            <MiniStat value={totalCompleted} label="Completed" />
            <MiniStat value={approvalRate} label="Approval" />
            <MiniStat
              value={`${totalProjects - totalCompleted}`}
              label="Pending"
            />
          </Box>
        </Box>
      </Card>

      <Box sx={{ mt: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            minHeight: 40,
            "& .MuiTab-root": {
              minHeight: 40,
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 1,
              mr: 1,
              minWidth: 120,
              color: "#6B7280",
              bgcolor: "transparent",
            },
            "& .Mui-selected": {
              color: "#111827 !important",
              bgcolor: "#fff",
              border: "1px solid #EDE7E1",
            },
            "& .MuiTabs-indicator": {
              display: "none",
            },
          }}
        >
          <Tab label="Personal Info" />
          <Tab label="Security" />
          <Tab label="Notifications" />
        </Tabs>
      </Box>

      {tab === 0 ? (
        <>
          <Box
            sx={{
              mt: 2,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 2,
            }}
          >
            <Card
              sx={{
                p: 3,
                borderRadius: 1,
                border: "1px solid #EDE7E1",
                boxShadow: "none",
              }}
            >
              <Typography
                sx={{ fontSize: 18, fontWeight: 800, color: "#111827" }}
              >
                Contact Information
              </Typography>

              <Stack spacing={2.2} sx={{ mt: 2.5 }}>
                <InfoRow
                  icon={<EmailOutlined sx={{ fontSize: 18 }} />}
                  label="Email"
                  value={email}
                />
                <InfoRow
                  icon={<PhoneOutlined sx={{ fontSize: 18 }} />}
                  label="Phone"
                  value={phone}
                />
                <InfoRow
                  icon={<LocationOnOutlined sx={{ fontSize: 18 }} />}
                  label="Location"
                  value={location}
                />
                <InfoRow
                  icon={<BusinessCenterOutlined sx={{ fontSize: 18 }} />}
                  label="Department"
                  value={department}
                />
              </Stack>
            </Card>

            <Card
              sx={{
                p: 3,
                borderRadius: 1,
                border: "1px solid #EDE7E1",
                boxShadow: "none",
              }}
            >
              <Typography
                sx={{ fontSize: 18, fontWeight: 800, color: "#111827" }}
              >
                Account Details
              </Typography>

              <Stack spacing={2.2} sx={{ mt: 2.5 }}>
                <InfoRow
                  icon={<PublicOutlined sx={{ fontSize: 18 }} />}
                  label="Timezone"
                  value={timezone}
                />
                <InfoRow
                  icon={<CalendarMonthOutlined sx={{ fontSize: 18 }} />}
                  label="Member Since"
                  value={
                    joinedAt ? new Date(joinedAt).toLocaleDateString() : "—"
                  }
                />
                <InfoRow
                  icon={<AccessTimeOutlined sx={{ fontSize: 18 }} />}
                  label="Last Login"
                  value={lastLogin ? new Date(lastLogin).toLocaleString() : "—"}
                />
                <InfoRow
                  icon={<ShieldOutlined sx={{ fontSize: 18 }} />}
                  label="Account Status"
                  value={statusChip(status)}
                  isNode
                />
              </Stack>
            </Card>
          </Box>

          <Card
            sx={{
              mt: 2,
              p: 3,
              borderRadius: 1,
              border: "1px solid #EDE7E1",
              boxShadow: "none",
            }}
          >
            <Typography
              sx={{ fontSize: 18, fontWeight: 800, color: "#111827" }}
            >
              Recent Activity
            </Typography>

            <Stack spacing={2} sx={{ mt: 2.5 }}>
              {activity.length ? (
                activity.map((item, index) => (
                  <Box key={item.id || item._id || index}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      spacing={2}
                    >
                      <Stack
                        direction="row"
                        spacing={1.2}
                        alignItems="flex-start"
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: item.color || "#22C55E",
                            mt: 0.8,
                          }}
                        />
                        <Box>
                          <Typography
                            sx={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "#111827",
                            }}
                          >
                            {item.title || "Activity"}
                          </Typography>
                          <Typography
                            sx={{
                              mt: 0.35,
                              fontSize: 12.5,
                              color: "#9CA3AF",
                            }}
                          >
                            {item.subtitle || item.message || ""}
                          </Typography>
                        </Box>
                      </Stack>

                      <Typography sx={{ fontSize: 12.5, color: "#9CA3AF" }}>
                        {item.timeAgo || item.date || ""}
                      </Typography>
                    </Stack>

                    {index !== activity.length - 1 ? (
                      <Divider sx={{ mt: 1.5 }} />
                    ) : null}
                  </Box>
                ))
              ) : (
                <EmptyStateBox label="No recent activity available" />
              )}
            </Stack>
          </Card>
        </>
      ) : tab === 1 ? (
        <Card
          sx={{
            mt: 2,
            p: 3,
            borderRadius: 1,
            border: "1px solid #EDE7E1",
            boxShadow: "none",
          }}
        >
          <Typography sx={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>
            Security
          </Typography>
          <Typography sx={{ mt: 1.5, fontSize: 14, color: "#9CA3AF" }}>
            Security settings data is not available yet.
          </Typography>
        </Card>
      ) : (
        <Card
          sx={{
            mt: 2,
            p: 3,
            borderRadius: 1,
            border: "1px solid #EDE7E1",
            boxShadow: "none",
          }}
        >
          <Typography sx={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>
            Notifications
          </Typography>
          <Typography sx={{ mt: 1.5, fontSize: 14, color: "#9CA3AF" }}>
            Notification preferences data is not available yet.
          </Typography>
        </Card>
      )}

      <VendorEditProfileDialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        profile={profile}
        onSaved={() => fetchProfile()}
      />
    </Box>
  );
}

function MiniStat({ value, label }) {
  return (
    <Card
      sx={{
        p: 1.75,
        borderRadius: 1,
        border: "1px solid #F0EBE6",
        boxShadow: "none",
      }}
    >
      <Typography
        sx={{ fontSize: 28, fontWeight: 900, color: "#111827", lineHeight: 1 }}
      >
        {value}
      </Typography>
      <Typography
        sx={{
          mt: 0.7,
          fontSize: 11,
          color: "#9CA3AF",
          fontWeight: 700,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>
    </Card>
  );
}

function InfoRow({ icon, label, value, isNode = false }) {
  return (
    <Stack direction="row" spacing={1.2} alignItems="flex-start">
      <Box
        sx={{
          color: "#D88B72",
          display: "flex",
          alignItems: "center",
          mt: 0.2,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: 12.5, color: "#9CA3AF", fontWeight: 700 }}>
          {label}
        </Typography>
        {isNode ? (
          <Box sx={{ mt: 0.35 }}>{value}</Box>
        ) : (
          <Typography
            sx={{ mt: 0.35, fontSize: 14, color: "#111827", fontWeight: 700 }}
          >
            {value}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

function EmptyStateBox({ label }) {
  return (
    <Box
      sx={{
        minHeight: 120,
        border: "1px dashed #E5DED7",
        borderRadius: 1,
        bgcolor: "#FCFAF8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#B0B5BE",
        fontSize: 14,
      }}
    >
      {label}
    </Box>
  );
}
