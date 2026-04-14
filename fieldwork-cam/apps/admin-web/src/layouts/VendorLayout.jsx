import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Avatar,
  Badge,
  Box,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  OutlinedInput,
  Stack,
  Typography,
} from "@mui/material";
import {
  DashboardOutlined,
  FolderOpenOutlined,
  ReceiptLongOutlined,
  BarChartOutlined,
  AutoGraphOutlined,
  GroupsOutlined,
  SupportAgentOutlined,
  SearchOutlined,
  KeyboardArrowDownOutlined,
  LogoutOutlined,
  PersonOutlineOutlined,
  NotificationsNoneOutlined,
  CalendarMonthOutlined,
} from "@mui/icons-material";
import { useAuth } from "../auth/AuthContext";
import NotificationsPanel from "../components/NotificationsPanel";
import { getUnreadNotificationsCountApi } from "../api/notification.api";

const drawerWidth = 214;

const navItems = [
  { label: "Dashboard", to: "/vendor/dashboard", icon: <DashboardOutlined /> },
  { label: "Projects", to: "/vendor/projects", icon: <FolderOpenOutlined /> },
  { label: "Invoices", to: "/vendor/invoices", icon: <ReceiptLongOutlined /> },
  { label: "Earnings", to: "/vendor/earnings", icon: <BarChartOutlined /> },
  { label: "Staff", to: "/vendor/staff", icon: <GroupsOutlined /> },
  { label: "Performance", to: "/vendor/performance", icon: <AutoGraphOutlined /> },
  { label: "Support", to: "/vendor/support", icon: <SupportAgentOutlined /> },
];

export default function VendorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const displayName = user?.fullName || user?.email || user?.phone || "Vendor";
  const subtitleName = user?.fullName?.split(" ")?.[0] || "there";
  const roleSubtitle =
    user?.jobTitle || (user?.role === "VENDOR_OWNER" ? "Vendor" : "Account");

  const avatarLetter = (user?.fullName || user?.email || "V")
    .charAt(0)
    .toUpperCase();

  const openMenu = Boolean(anchorEl);
  const formattedDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await getUnreadNotificationsCountApi();
        const data = res?.data || res || {};
        setUnreadCount(Number(data?.count || 0));
      } catch {
        setUnreadCount(0);
      }
    };

    fetchUnreadCount();
  }, []);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#F8F5F2" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            borderRight: "1px solid #E9E1DB",
            bgcolor: "#FFFFFF",
            p: 1.5,
          },
        }}
      >
        <Box sx={{ px: 1, pt: 0.75, pb: 1.5 }}>
          <Box component="img" src="/logo.png" sx={{ width: 115, ml: 3 }} />
        </Box>

        <List sx={{ p: 0, display: "flex", flexDirection: "column", gap: 0.75, flex: 1 }}>
          {navItems.map((item) => (
            <ListItemButton
              key={item.to}
              component={NavLink}
              to={item.to}
              sx={{
                borderRadius: 1.5,
                px: 1.1,
                py: 0.8,
                color: "#6B7280",
                transition: "all 0.2s ease",
                "& .MuiListItemIcon-root": {
                  color: "inherit",
                },
                "&:hover": {
                  bgcolor: "#F6F1EC",
                  color: "#1F2937",
                },
                "&.active": {
                  bgcolor: "#E9CFC2",
                  color: "#1F2937",
                  boxShadow: "0 6px 14px rgba(201, 180, 168, 0.16)",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 32,
                  color: "inherit",
                }}
              >
                {item.icon}
              </ListItemIcon>

              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: 1.2,
                }}
              />
            </ListItemButton>
          ))}
        </List>

        <Box
          sx={{
            mt: "auto",
            pt: 1.5,
            borderTop: "1px solid #F0EBE6",
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  bgcolor: "#F59E0B",
                  color: "#FFFFFF",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {avatarLetter}
              </Avatar>

              <Box>
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: "#1F2937" }}>
                  {displayName}
                </Typography>
                <Typography sx={{ fontSize: 10.5, color: "#B0B5BE", fontWeight: 500 }}>
                  {roleSubtitle}
                </Typography>
              </Box>
            </Stack>

            <IconButton
              size="small"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              sx={{ color: "#9CA3AF" }}
            >
              <LogoutOutlined sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>
        </Box>
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            height: 60,
            bgcolor: "#FFFFFF",
            borderBottom: "1px solid #E9E1DB",
            px: 1.75,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 700,
                color: "#1F2937",
                lineHeight: 1.2,
              }}
            >
              FieldWork Cam
            </Typography>
            <Typography
              sx={{
                mt: 0.2,
                fontSize: 11.5,
                fontWeight: 500,
                color: "#B0B5BE",
              }}
            >
              Welcome back, {subtitleName}. Here's your overview.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <OutlinedInput
              size="small"
              placeholder="Search projects..."
              startAdornment={
                <InputAdornment position="start">
                  <SearchOutlined sx={{ fontSize: 18, color: "#9CA3AF" }} />
                </InputAdornment>
              }
              sx={{
                width: 260,
                height: 36,
                bgcolor: "#FFFFFF",
                borderRadius: 1.5,
                fontSize: 13,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#E9E1DB",
                },
              }}
            />

            <Stack
              direction="row"
              spacing={0.75}
              alignItems="center"
              sx={{
                height: 36,
                px: 1,
                border: "1px solid #E9E1DB",
                borderRadius: 1.5,
                bgcolor: "#FFFFFF",
                color: "#6B7280",
              }}
            >
              <CalendarMonthOutlined sx={{ fontSize: 16 }} />
              <Typography sx={{ fontSize: 11.5, fontWeight: 500 }}>
                {formattedDate}
              </Typography>
            </Stack>

            <IconButton
              onClick={() => setNotificationsOpen(true)}
              sx={{
                width: 38,
                height: 36,
                border: "1px solid #E9E1DB",
                borderRadius: 1.5,
                bgcolor: "#FFFFFF",
                color: "#6B7280",
              }}
            >
              <Badge color="error" badgeContent={unreadCount} overlap="circular" max={99}>
                <NotificationsNoneOutlined sx={{ fontSize: 18 }} />
              </Badge>
            </IconButton>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                cursor: "pointer",
                border: "1px solid #E9E1DB",
                borderRadius: 999,
                pl: 0.7,
                pr: 0.9,
                py: 0.45,
                bgcolor: "#FFFFFF",
              }}
            >
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  bgcolor: "#F59E0B",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {avatarLetter}
              </Avatar>

              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#1F2937",
                }}
              >
                {avatarLetter}
              </Typography>

              <KeyboardArrowDownOutlined
                sx={{ fontSize: 16, color: "#6B7280" }}
              />
            </Stack>
          </Stack>

          <Menu
            anchorEl={anchorEl}
            open={openMenu}
            onClose={() => setAnchorEl(null)}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 160,
                borderRadius: 1.5,
                border: "1px solid #F0EBE6",
              },
            }}
          >
            <MenuItem
              onClick={() => navigate("/vendor/profile")}
              sx={{ fontSize: 13, fontWeight: 600 }}
            >
              <PersonOutlineOutlined sx={{ mr: 1 }} />
              Profile
            </MenuItem>

            <MenuItem
              onClick={() => {
                logout();
                navigate("/login");
              }}
              sx={{ fontSize: 13, fontWeight: 600, color: "#DC2626" }}
            >
              <LogoutOutlined sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>

        <Box sx={{ p: 1.75 }}>
          <Outlet />
        </Box>
      </Box>

      <NotificationsPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        unreadCount={unreadCount}
        onUnreadCountChange={setUnreadCount}
      />
    </Box>
  );
}
