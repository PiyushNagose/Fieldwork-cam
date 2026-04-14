import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Stack,
  Typography,
} from "@mui/material";
import {
  BuildCircleOutlined,
  CloseOutlined,
  DeleteOutlineOutlined,
  DoneAllOutlined,
  FilterListOutlined,
  FolderOpenOutlined,
  GroupOutlined,
  NotificationsNoneOutlined,
  PaymentsOutlined,
  SearchOutlined,
  SupportAgentOutlined,
  AccessTimeOutlined,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import {
  clearAllNotificationsApi,
  getNotificationsApi,
  getUnreadNotificationsCountApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from "../api/notification.api";

const FILTERS = ["ALL", "UNREAD", "READ"];

export default function NotificationsPanel({
  open,
  onClose,
  unreadCount,
  onUnreadCountChange,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError("");

        const [listRes, countRes] = await Promise.all([
          getNotificationsApi(),
          getUnreadNotificationsCountApi(),
        ]);

        const list = listRes?.data || listRes || [];
        const unreadData = countRes?.data || countRes || {};

        setNotifications(Array.isArray(list) ? list : []);
        onUnreadCountChange?.(Number(unreadData?.count || 0));
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            "Failed to load notifications",
        );
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchNotifications();
    }
  }, [open, onUnreadCountChange]);

  const counts = useMemo(() => {
    const all = notifications.length;
    const unread = notifications.filter((item) => !item.isRead).length;
    const read = notifications.filter((item) => item.isRead).length;
    return { all, unread, read };
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notifications.filter((item) => {
      const matchesFilter =
        filter === "ALL"
          ? true
          : filter === "UNREAD"
            ? !item.isRead
            : item.isRead;

      const matchesSearch = query
        ? [
            item.title,
            item.message,
            item.type,
            item.entityType,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query)
        : true;

      return matchesFilter && matchesSearch;
    });
  }, [filter, notifications, search]);

  const handleMarkOneRead = async (notification) => {
    try {
      if (notification.isRead) return;

      await markNotificationReadApi(notification._id || notification.id);

      setNotifications((prev) =>
        prev.map((item) =>
          (item._id || item.id) === (notification._id || notification.id)
            ? { ...item, isRead: true }
            : item,
        ),
      );
      onUnreadCountChange?.(Math.max((unreadCount || 0) - 1, 0));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to mark notification as read",
      );
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setActing(true);
      await markAllNotificationsReadApi();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      onUnreadCountChange?.(0);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to mark all as read",
      );
    } finally {
      setActing(false);
    }
  };

  const handleClearAll = async () => {
    try {
      setActing(true);
      await clearAllNotificationsApi();
      setNotifications([]);
      onUnreadCountChange?.(0);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to clear notifications",
      );
    } finally {
      setActing(false);
    }
  };

  const handlePrimaryAction = async (notification) => {
    await handleMarkOneRead(notification);

    const type = String(notification.type || notification.entityType || "").toUpperCase();
    const meta = notification.meta || {};
    const entityId =
      notification.entityId ||
      meta.projectId ||
      meta._id ||
      meta.id ||
      "";
    const isVendor = location.pathname.startsWith("/vendor");

    if (type.includes("PROJECT")) {
      if (entityId) {
        navigate(isVendor ? `/vendor/projects/${entityId}` : `/admin/projects/${entityId}`);
      } else {
        navigate(isVendor ? "/vendor/projects" : "/admin/projects");
      }
      onClose?.();
      return;
    }

    if (type.includes("SUPPORT")) {
      navigate(isVendor ? "/vendor/support" : "/admin/support");
      onClose?.();
      return;
    }

    if (type.includes("PAYMENT") || type.includes("INVOICE")) {
      navigate(isVendor ? "/vendor/earnings" : "/admin/invoices");
      onClose?.();
      return;
    }

    if (type.includes("STAFF") || type.includes("TEAM")) {
      navigate(isVendor ? "/vendor/staff" : "/admin/vendors");
      onClose?.();
      return;
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 420 },
          bgcolor: "#FFFFFF",
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box
          sx={{
            px: 2,
            py: 1.75,
            bgcolor: "#D8C2B6",
            borderBottom: "1px solid #E9DDD5",
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack direction="row" spacing={1.4} alignItems="center">
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 1.5,
                  bgcolor: "#F6E9E1",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Badge badgeContent={unreadCount || 0} color="error" max={99}>
                  <NotificationsNoneOutlined sx={{ color: "#1F2937" }} />
                </Badge>
              </Box>

              <Box>
                <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>
                  Notifications
                </Typography>
                <Typography sx={{ mt: 0.25, fontSize: 12.5, color: "#5F6368" }}>
                  {unreadCount || 0} unread notifications
                </Typography>
              </Box>
            </Stack>

            <IconButton onClick={onClose} size="small">
              <CloseOutlined sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ mt: 1.7 }}>
            <Button
              variant="outlined"
              startIcon={<DoneAllOutlined sx={{ fontSize: 16 }} />}
              onClick={handleMarkAllRead}
              disabled={acting || !counts.unread}
              sx={topActionButtonSx}
            >
              Mark all read
            </Button>
            <Button
              variant="outlined"
              startIcon={<DeleteOutlineOutlined sx={{ fontSize: 16 }} />}
              onClick={handleClearAll}
              disabled={acting || !counts.all}
              sx={topActionButtonSx}
            >
              Clear all
            </Button>
          </Stack>
        </Box>

        <Box sx={{ px: 2, py: 1.7 }}>
          <Stack direction="row" spacing={0.7} alignItems="center">
            <FilterListOutlined sx={{ fontSize: 16, color: "#6B7280" }} />
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 800,
                color: "#6B7280",
                letterSpacing: "0.04em",
              }}
            >
              FILTER
            </Typography>
          </Stack>

          <Stack direction="row" spacing={0.75} sx={{ mt: 1.15, flexWrap: "wrap" }}>
            {FILTERS.map((item) => (
              <FilterChip
                key={item}
                label={
                  item === "ALL"
                    ? `All ${counts.all}`
                    : item === "UNREAD"
                      ? `Unread ${counts.unread}`
                      : `Read ${counts.read}`
                }
                active={filter === item}
                onClick={() => setFilter(item)}
              />
            ))}
          </Stack>

          <OutlinedInput
            fullWidth
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search notifications..."
            startAdornment={
              <InputAdornment position="start">
                <SearchOutlined sx={{ fontSize: 17, color: "#A8A29E" }} />
              </InputAdornment>
            }
            sx={{
              mt: 1.4,
              height: 40,
              borderRadius: 1.5,
              fontSize: 13,
              bgcolor: "#FFFFFF",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E8E1DA" },
            }}
          />
        </Box>

        <Divider />

        <Box sx={{ flex: 1, overflowY: "auto", px: 1.4, py: 1.25 }}>
          {loading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 260 }} spacing={2}>
              <CircularProgress size={26} />
              <Typography color="text.secondary">Loading notifications...</Typography>
            </Stack>
          ) : error ? (
            <Box sx={{ p: 1.5 }}>
              <Alert severity="error" sx={{ borderRadius: 1 }}>
                {error}
              </Alert>
            </Box>
          ) : filteredNotifications.length === 0 ? (
            <Box
              sx={{
                m: 1.5,
                minHeight: 220,
                borderRadius: 1.5,
                border: "1px dashed #E5DED7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#B0B5BE",
                fontSize: 13,
                bgcolor: "#FCFAF8",
              }}
            >
              No notifications found
            </Box>
          ) : (
            <>
              <Typography
                sx={{
                  px: 1,
                  mb: 1,
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#6B7280",
                  letterSpacing: "0.04em",
                }}
              >
                TODAY
              </Typography>

              <Stack spacing={0.7}>
                {filteredNotifications.map((notification, index) => (
                  <NotificationCard
                    key={notification._id || notification.id || index}
                    notification={notification}
                    onMarkRead={() => handleMarkOneRead(notification)}
                    onPrimaryAction={() => handlePrimaryAction(notification)}
                  />
                ))}
              </Stack>
            </>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}

function NotificationCard({ notification, onMarkRead, onPrimaryAction }) {
  const iconConfig = getNotificationVisuals(notification.type || notification.entityType);
  const actionLabel = getActionLabel(notification.type || notification.entityType);
  const title = notification.title || "Notification";
  const message = notification.message || notification.description || "";
  const isUnread = !notification.isRead;
  const timeLabel = formatRelativeTime(notification.createdAt || notification.updatedAt);

  return (
    <Box
      onClick={onMarkRead}
      sx={{
        position: "relative",
        px: 1.15,
        py: 1.05,
        borderRadius: 1.5,
        bgcolor: "#FFFFFF",
        borderBottom: "1px solid #F0EBE6",
        cursor: "pointer",
      }}
    >
      {isUnread ? (
        <Box
          sx={{
            position: "absolute",
            left: 4,
            top: 44,
            width: 7,
            height: 7,
            borderRadius: "50%",
            bgcolor: "#2563EB",
          }}
        />
      ) : null}

      <Stack direction="row" spacing={1.2} sx={{ ml: isUnread ? 1.1 : 0 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1.5,
            bgcolor: iconConfig.bg,
            color: iconConfig.color,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          {iconConfig.icon}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
            {title}
          </Typography>
          <Typography
            sx={{
              mt: 0.35,
              fontSize: 12.5,
              color: "#4B5563",
              lineHeight: 1.5,
            }}
          >
            {message}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.8, flexWrap: "wrap" }}>
            <Stack direction="row" spacing={0.45} alignItems="center">
              <AccessTimeOutlined sx={{ fontSize: 14, color: "#9CA3AF" }} />
              <Typography sx={{ fontSize: 12, color: "#8C8C8C" }}>{timeLabel}</Typography>
            </Stack>

            <Chip
              label={actionLabel.chip}
              size="small"
              sx={{
                borderRadius: 1,
                height: 22,
                bgcolor: actionLabel.bg,
                color: actionLabel.color,
                fontWeight: 700,
                fontSize: 10.5,
              }}
            />
          </Stack>

          {actionLabel.button ? (
            <Button
              variant="contained"
              onClick={(event) => {
                event.stopPropagation();
                onPrimaryAction();
              }}
              sx={{
                mt: 1.05,
                minHeight: 28,
                px: 1.35,
                borderRadius: 1.2,
                bgcolor: "#9D8A7D",
                color: "#FFFFFF",
                textTransform: "none",
                fontSize: 11.5,
                fontWeight: 700,
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "#8D7B72",
                  boxShadow: "none",
                },
              }}
            >
              {actionLabel.button}
            </Button>
          ) : null}
        </Box>
      </Stack>
    </Box>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <Button
      onClick={onClick}
      sx={{
        minHeight: 30,
        px: 1.4,
        borderRadius: 1.2,
        bgcolor: active ? "#9D8A7D" : "#F7F8FA",
        color: active ? "#FFFFFF" : "#4B5563",
        border: active ? "none" : "1px solid #ECEFF3",
        textTransform: "none",
        fontSize: 12,
        fontWeight: 700,
        boxShadow: "none",
        "&:hover": {
          bgcolor: active ? "#8D7B72" : "#F0F3F7",
          boxShadow: "none",
        },
      }}
    >
      {label}
    </Button>
  );
}

function getNotificationVisuals(type = "") {
  const normalized = String(type).toUpperCase();

  if (normalized.includes("PROJECT")) {
    return {
      bg: "#EAF2FF",
      color: "#3B82F6",
      icon: <FolderOpenOutlined sx={{ fontSize: 20 }} />,
    };
  }
  if (normalized.includes("SUPPORT")) {
    return {
      bg: "#FFF1E7",
      color: "#F97316",
      icon: <SupportAgentOutlined sx={{ fontSize: 20 }} />,
    };
  }
  if (normalized.includes("PAYMENT") || normalized.includes("INVOICE")) {
    return {
      bg: "#EAFBF1",
      color: "#22C55E",
      icon: <PaymentsOutlined sx={{ fontSize: 20 }} />,
    };
  }
  if (normalized.includes("STAFF") || normalized.includes("TEAM")) {
    return {
      bg: "#F5EAFE",
      color: "#A855F7",
      icon: <GroupOutlined sx={{ fontSize: 20 }} />,
    };
  }
  return {
    bg: "#FDECEC",
    color: "#EF4444",
    icon: <BuildCircleOutlined sx={{ fontSize: 20 }} />,
  };
}

function getActionLabel(type = "") {
  const normalized = String(type).toUpperCase();

  if (normalized.includes("PROJECT")) {
    return { chip: "Project Update", bg: "#EAF2FF", color: "#3B82F6", button: "View Project" };
  }
  if (normalized.includes("SUPPORT")) {
    return { chip: "Support Ticket", bg: "#FFF1E7", color: "#F97316", button: "View Ticket" };
  }
  if (normalized.includes("PAYMENT") || normalized.includes("INVOICE")) {
    return { chip: "Payment", bg: "#EAFBF1", color: "#22C55E", button: null };
  }
  if (normalized.includes("STAFF") || normalized.includes("TEAM")) {
    return { chip: "Staff Assignment", bg: "#F5EAFE", color: "#A855F7", button: null };
  }
  return { chip: "System", bg: "#FDECEC", color: "#EF4444", button: null };
}

function formatRelativeTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(diffMs)) return "-";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

const topActionButtonSx = {
  borderRadius: 1.2,
  borderColor: "#E8DED8",
  color: "#4B5563",
  bgcolor: "#FFF8F4",
  textTransform: "none",
  fontSize: 12,
  fontWeight: 700,
  minHeight: 32,
  "&:hover": {
    borderColor: "#DDD1C8",
    bgcolor: "#FFF4EE",
  },
  "&.Mui-disabled": {
    borderColor: "#EEE5DF",
    color: "#B0B5BE",
  },
};
