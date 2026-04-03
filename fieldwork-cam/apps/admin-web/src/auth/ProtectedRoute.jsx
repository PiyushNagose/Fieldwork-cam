import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { isAuthenticated, user, initializing } = useAuth();

  if (initializing) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#F8F5F2" }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography sx={{ color: "#6B7280", fontWeight: 600 }}>
            Verifying session...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
