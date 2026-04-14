import React, { useEffect, useState } from "react";
import { useNavigate, NavLink, Outlet } from "react-router-dom";
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
  GroupsOutlined,
  ReceiptLongOutlined,
  BarChartOutlined,
  HandymanOutlined,
  SupportAgentOutlined,
  SearchOutlined,
  NotificationsNoneOutlined,
  KeyboardArrowDownOutlined,
  PersonOutlineOutlined,
  LogoutOutlined,
} from "@mui/icons-material";
import { useAuth } from "../auth/AuthContext";
import NotificationsPanel from "../components/NotificationsPanel";
import { getUnreadNotificationsCountApi } from "../api/notification.api";

const drawerWidth = 214;

const navItems = [
  { label: "Dashboard", to: "/admin/dashboard", icon: <DashboardOutlined /> },
  { label: "Projects", to: "/admin/projects", icon: <FolderOpenOutlined /> },
  { label: "Vendors", to: "/admin/vendors", icon: <GroupsOutlined /> },
  { label: "Invoices", to: "/admin/invoices", icon: <ReceiptLongOutlined /> },
  { label: "Analytics", to: "/admin/analytics", icon: <BarChartOutlined /> },
  { label: "Services", to: "/admin/services", icon: <HandymanOutlined /> },
  { label: "Support", to: "/admin/support", icon: <SupportAgentOutlined /> },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const displayName =
    user?.fullName || user?.email || user?.phone || "Admin User";

  const avatarLetter = (user?.fullName || user?.email || "A")
    .charAt(0)
    .toUpperCase();

  const openMenu = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleMenuClose();
    navigate("/admin/profile");
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate("/login");
  };

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
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid #E9E1DB",
            bgcolor: "#FFFFFF",
            p: 1.5,
          },
        }}
      >
        <Box sx={{ px: 1, pt: 0.75, pb: 1.5 }}>
          <Box
            component="img"
            src="/logo.png"
            alt="Logo"
          sx={{ width: 115, objectFit: "contain", ml: 3 }}
        />
      </Box>

        <List
          sx={{ p: 0, display: "flex", flexDirection: "column", gap: 0.75 }}
        >
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
                  bgcolor: "#F1EBE6",
                  color: "#1F2937",
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
          <OutlinedInput
            size="small"
            placeholder="Search..."
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
              color: "#374151",
              "& .MuiOutlinedInput-input": {
                py: 1,
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#E9E1DB",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#DDD2C7",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#D5C6BA",
                borderWidth: "1px",
              },
            }}
          />

          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              onClick={() => setNotificationsOpen(true)}
              sx={{
                width: 38,
                height: 36,
                border: "1px solid #E9E1DB",
                borderRadius: 1.5,
                bgcolor: "#FFFFFF",
                color: "#6B7280",
                "&:hover": {
                  bgcolor: "#F6F1EC",
                },
              }}
            >
              <Badge
                color="error"
                badgeContent={unreadCount}
                overlap="circular"
                max={99}
              >
                <NotificationsNoneOutlined sx={{ fontSize: 19 }} />
              </Badge>
            </IconButton>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              onClick={handleMenuOpen}
              sx={{
                cursor: "pointer",
                border: "1px solid #E9E1DB",
                borderRadius: 999,
                px: 1.1,
                py: 0.5,
                bgcolor: "#FFFFFF",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: "#F6F1EC",
                },
              }}
            >
              <Avatar
                sx={{
                  width: 30,
                  height: 30,
                  bgcolor: "#CBB8AD",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {avatarLetter}
              </Avatar>

              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1F2937",
                  lineHeight: 1.2,
                }}
              >
                {displayName}
              </Typography>

              <KeyboardArrowDownOutlined
                sx={{ fontSize: 18, color: "#6B7280" }}
              />
            </Stack>

            <Menu
              anchorEl={anchorEl}
              open={openMenu}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 160,
                  borderRadius: 1.5,
                  border: "1px solid #F0EBE6",
                  boxShadow: "0 8px 24px rgba(17, 24, 39, 0.06)",
                },
              }}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              <MenuItem
                onClick={handleProfileClick}
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1F2937",
                  py: 1,
                }}
              >
                <PersonOutlineOutlined sx={{ fontSize: 18, mr: 1 }} />
                Profile
              </MenuItem>

              <MenuItem
                onClick={handleLogout}
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#DC2626",
                  py: 1,
                }}
              >
                <LogoutOutlined sx={{ fontSize: 18, mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Stack>
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
