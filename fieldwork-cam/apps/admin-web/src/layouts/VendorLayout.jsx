import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Drawer,
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
  GroupsOutlined,
  SupportAgentOutlined,
  SearchOutlined,
  KeyboardArrowDownOutlined,
  LogoutOutlined,
  PersonOutlineOutlined,
} from "@mui/icons-material";
import { useAuth } from "../auth/AuthContext";

const drawerWidth = 220;

const navItems = [
  { label: "Dashboard", to: "/vendor/dashboard", icon: <DashboardOutlined /> },
  { label: "Projects", to: "/vendor/projects", icon: <FolderOpenOutlined /> },
  { label: "Invoices", to: "/vendor/invoices", icon: <ReceiptLongOutlined /> },
  { label: "Earnings", to: "/vendor/earnings", icon: <BarChartOutlined /> },
  { label: "Staff", to: "/vendor/staff", icon: <GroupsOutlined /> },
  { label: "Support", to: "/vendor/support", icon: <SupportAgentOutlined /> },
];

export default function VendorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);

  const displayName = user?.fullName || user?.email || user?.phone || "Vendor";

  const avatarLetter = (user?.fullName || user?.email || "V")
    .charAt(0)
    .toUpperCase();

  const openMenu = Boolean(anchorEl);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#F8F5F2" }}>
      {/* SIDEBAR */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            borderRight: "1px solid #E9E1DB",
            bgcolor: "#FFFFFF",
            p: 2,
          },
        }}
      >
        <Box sx={{ px: 1, pt: 1, pb: 2 }}>
          <Box component="img" src="/logo.png" sx={{ width: 115, ml: 3 }} />
        </Box>

        <List sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
          {navItems.map((item) => (
            <ListItemButton
              key={item.to}
              component={NavLink}
              to={item.to}
              sx={{
                borderRadius: 1,
                px: 1.2,
                py: 0.9,
                color: "#6B7280",
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
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {/* MAIN */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* TOPBAR */}
        <Box
          sx={{
            height: 64,
            bgcolor: "#FFFFFF",
            borderBottom: "1px solid #E9E1DB",
            px: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <OutlinedInput
            size="small"
            placeholder="Search projects..."
            startAdornment={
              <InputAdornment position="start">
                <SearchOutlined sx={{ fontSize: 18 }} />
              </InputAdornment>
            }
            sx={{
              width: 260,
              bgcolor: "#FFFFFF",
              borderRadius: 1,
              fontSize: 13,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#E9E1DB",
              },
            }}
          />

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              cursor: "pointer",
              border: "1px solid #E9E1DB",
              borderRadius: 3,
              px: 1.2,
              py: 0.6,
              bgcolor: "#FFFFFF",
            }}
          >
            <Avatar
              sx={{
                width: 30,
                height: 30,
                bgcolor: "#CBB8AD",
                fontSize: 12,
              }}
            >
              {avatarLetter}
            </Avatar>

            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                color: "#1F2937",
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
            onClose={() => setAnchorEl(null)}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 160,
                borderRadius: 1,
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

        {/* CONTENT */}
        <Box sx={{ p: 2 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
