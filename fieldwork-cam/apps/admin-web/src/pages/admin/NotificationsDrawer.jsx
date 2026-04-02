import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
  Alert,
  Badge,
} from "@mui/material";
import {
  CloseOutlined,
  NotificationsNoneOutlined,
  DoneAllOutlined,
  FolderOpenOutlined,
  SupportAgentOutlined,
  PaymentsOutlined,
  GroupOutlined,
  BuildCircleOutlined,
  AccessTimeOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  getNotificationsApi,
  getUnreadNotificationsCountApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from "../../api/notification.api";

const FILTERS = ["ALL", "UNREAD", "READ"];

export default function NotificationsDrawer({
  open,
  onClose,
  unreadCount,
  onUnreadCountChange,
}) {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

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
          err?.message ||
          "Failed to load notifications",
      );
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  const filteredNotifications = useMemo(() => {
    if (filter === "UNREAD") {
      return notifications.filter((item) => !item.isRead);
    }

    if (filter === "READ") {
      return notifications.filter((item) => item.isRead);
    }

    return notifications;
  }, [notifications, filter]);

  const counts = useMemo(() => {
    const all = notifications.length;
    const unread = notifications.filter((n) => !n.isRead).length;
    const read = notifications.filter((n) => n.isRead).length;

    return { all, unread, read };
  }, [notifications]);

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
          err?.message ||
          "Failed to mark notification as read",
      );
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setActing(true);
      await markAllNotificationsReadApi();

      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true })),
      );
      onUnreadCountChange?.(0);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to mark all as read",
      );
    } finally {
      setActing(false);
    }
  };

  const handlePrimaryAction = async (notification) => {
    await handleMarkOneRead(notification);

    const type = String(
      notification.type || notification.entityType || "",
    ).toUpperCase();
    const entityId = notification.entityId || "";

    if (type.includes("PROJECT")) {
      if (entityId) {
        navigate(`/admin/projects/${entityId}`);
      } else {
        navigate("/admin/projects");
      }
      onClose?.();
      return;
    }

    if (type.includes("SUPPORT")) {
      navigate("/admin/support");
      onClose?.();
      return;
    }

    if (type.includes("PAYMENT") || type.includes("INVOICE")) {
      navigate("/admin/invoices");
      onClose?.();
      return;
    }

    if (type.includes("STAFF") || type.includes("TEAM")) {
      navigate("/admin/vendors");
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
          width: { xs: "100%", sm: 430 },
          bgcolor: "#FFFFFF",
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box
          sx={{
            px: 2.5,
            py: 2.25,
            bgcolor: "#F4E9E3",
            borderBottom: "1px solid #EEE4DD",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <Stack direction="row" spacing={1.4} alignItems="center">
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  bgcolor: "#FFF8F4",
                  display: "grid",
                  placeItems: "center",
                  border: "1px solid #EADFD7",
                }}
              >
                <Badge badgeContent={unreadCount || 0} color="error">
                  <NotificationsNoneOutlined sx={{ color: "#1F2937" }} />
                </Badge>
              </Box>

              <Box>
                <Typography
                  sx={{ fontSize: 18, fontWeight: 700, color: "#111827" }}
                >
                  Notifications
                </Typography>
                <Typography sx={{ mt: 0.3, fontSize: 13, color: "#6B7280" }}>
                  {unreadCount || 0} unread notifications
                </Typography>
              </Box>
            </Stack>

            <IconButton onClick={onClose}>
              <CloseOutlined />
            </IconButton>
          </Stack>

          <Stack direction="row" spacing={1.2} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<DoneAllOutlined />}
              onClick={handleMarkAllRead}
              disabled={acting}
              sx={topActionButtonSx}
            >
              Mark all read
            </Button>
          </Stack>
        </Box>

        <Box sx={{ px: 2.5, py: 2 }}>
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

          <Stack
            direction="row"
            spacing={1}
            sx={{ mt: 1.25, flexWrap: "wrap" }}
          >
            <FilterChip
              label={`All ${counts.all}`}
              active={filter === "ALL"}
              onClick={() => setFilter("ALL")}
            />
            <FilterChip
              label={`Unread ${counts.unread}`}
              active={filter === "UNREAD"}
              onClick={() => setFilter("UNREAD")}
            />
            <FilterChip
              label={`Read ${counts.read}`}
              active={filter === "READ"}
              onClick={() => setFilter("READ")}
            />
          </Stack>
        </Box>

        <Divider />

        <Box sx={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{ minHeight: 260 }}
              spacing={2}
            >
              <CircularProgress size={26} />
              <Typography color="text.secondary">
                Loading notifications...
              </Typography>
            </Stack>
          ) : error ? (
            <Box sx={{ p: 2.5 }}>
              <Alert severity="error">{error}</Alert>
            </Box>
          ) : filteredNotifications.length === 0 ? (
            <Box sx={{ p: 2.5 }}>
              <Typography
                sx={{ fontSize: 15, fontWeight: 700, color: "#111827" }}
              >
                No notifications found
              </Typography>
              <Typography sx={{ mt: 0.7, fontSize: 13, color: "#9CA3AF" }}>
                There are no notifications for this filter.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ px: 1.5, py: 1.5 }}>
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

              <Stack spacing={1.1}>
                {filteredNotifications.map((notification, index) => (
                  <NotificationCard
                    key={notification._id || notification.id || index}
                    notification={notification}
                    onMarkRead={() => handleMarkOneRead(notification)}
                    onPrimaryAction={() => handlePrimaryAction(notification)}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}

function NotificationCard({ notification, onMarkRead, onPrimaryAction }) {
  const iconConfig = getNotificationVisuals(
    notification.type || notification.entityType,
  );
  const title = notification.title || "Notification";
  const message = notification.message || notification.description || "";
  const isUnread = !notification.isRead;
  const timeLabel = formatRelativeTime(
    notification.createdAt || notification.updatedAt,
  );
  const actionLabel = getActionLabel(
    notification.type || notification.entityType,
  );

  return (
    <Box
      onClick={onMarkRead}
      sx={{
        position: "relative",
        border: "1px solid #EEF1F4",
        borderRadius: 1,
        bgcolor: "#FFFFFF",
        p: 1.6,
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": {
          bgcolor: "#FCFAF8",
        },
      }}
    >
      {isUnread ? (
        <Box
          sx={{
            position: "absolute",
            left: 8,
            top: "50%",
            transform: "translateY(-50%)",
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: "#2563EB",
          }}
        />
      ) : null}

      <Stack direction="row" spacing={1.4} sx={{ ml: isUnread ? 1.1 : 0 }}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: "50%",
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
          <Typography
            sx={{
              fontSize: 15,
              fontWeight: 700,
              color: "#111827",
              lineHeight: 1.3,
            }}
          >
            {title}
          </Typography>

          <Typography
            sx={{ mt: 0.45, fontSize: 13.5, color: "#4B5563", lineHeight: 1.5 }}
          >
            {message}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <AccessTimeOutlined sx={{ fontSize: 14, color: "#9CA3AF" }} />
              <Typography sx={{ fontSize: 12.5, color: "#8C8C8C" }}>
                {timeLabel}
              </Typography>
            </Stack>

            <Chip
              label={actionLabel.chip}
              size="small"
              sx={{
                borderRadius: 1,
                height: 24,
                bgcolor: actionLabel.bg,
                color: actionLabel.color,
                fontWeight: 700,
              }}
            />
          </Stack>

          {actionLabel.button ? (
            <Button
              variant="contained"
              onClick={(e) => {
                e.stopPropagation();
                onPrimaryAction();
              }}
              sx={{
                mt: 1.25,
                minHeight: 32,
                px: 1.6,
                borderRadius: 1,
                bgcolor: "#8D7B72",
                textTransform: "none",
                fontSize: 12,
                fontWeight: 700,
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "#7D6B63",
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
        minHeight: 34,
        px: 1.6,
        borderRadius: 1,
        bgcolor: active ? "#9D8A7D" : "#F7F8FA",
        color: active ? "#FFFFFF" : "#4B5563",
        border: active ? "none" : "1px solid #ECEFF3",
        textTransform: "none",
        fontSize: 12.5,
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
      icon: <FolderOpenOutlined sx={{ fontSize: 22 }} />,
    };
  }

  if (normalized.includes("SUPPORT")) {
    return {
      bg: "#FFF1E7",
      color: "#F97316",
      icon: <SupportAgentOutlined sx={{ fontSize: 22 }} />,
    };
  }

  if (normalized.includes("PAYMENT") || normalized.includes("INVOICE")) {
    return {
      bg: "#EAFBF1",
      color: "#22C55E",
      icon: <PaymentsOutlined sx={{ fontSize: 22 }} />,
    };
  }

  if (normalized.includes("STAFF") || normalized.includes("TEAM")) {
    return {
      bg: "#F5EAFE",
      color: "#A855F7",
      icon: <GroupOutlined sx={{ fontSize: 22 }} />,
    };
  }

  return {
    bg: "#FDECEC",
    color: "#EF4444",
    icon: <BuildCircleOutlined sx={{ fontSize: 22 }} />,
  };
}

function getActionLabel(type = "") {
  const normalized = String(type).toUpperCase();

  if (normalized.includes("PROJECT")) {
    return {
      chip: "Project Update",
      bg: "#EAF2FF",
      color: "#3B82F6",
      button: "View Project",
    };
  }

  if (normalized.includes("SUPPORT")) {
    return {
      chip: "Support Ticket",
      bg: "#FFF1E7",
      color: "#F97316",
      button: "View Ticket",
    };
  }

  if (normalized.includes("PAYMENT") || normalized.includes("INVOICE")) {
    return {
      chip: "Payment",
      bg: "#EAFBF1",
      color: "#22C55E",
      button: null,
    };
  }

  if (normalized.includes("STAFF") || normalized.includes("TEAM")) {
    return {
      chip: "Staff Assignment",
      bg: "#F5EAFE",
      color: "#A855F7",
      button: null,
    };
  }

  return {
    chip: "System",
    bg: "#FDECEC",
    color: "#EF4444",
    button: null,
  };
}

function formatRelativeTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();

  if (Number.isNaN(diffMs)) return "—";

  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} min ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

const topActionButtonSx = {
  borderRadius: 1,
  borderColor: "#E8DED8",
  color: "#4B5563",
  bgcolor: "#FFF8F4",
  textTransform: "none",
  fontSize: 12,
  fontWeight: 700,
  minHeight: 34,
  "&:hover": {
    borderColor: "#DDD1C8",
    bgcolor: "#FFF4EE",
  },
};
