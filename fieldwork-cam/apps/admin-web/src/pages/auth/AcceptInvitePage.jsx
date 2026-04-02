import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  Stack,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

export default function AcceptInvitePage() {
  const [params] = useSearchParams();
  const token = params.get("token");

  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (!password || !confirmPassword) {
      return setError("All fields are required");
    }

    if (password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/auth/accept-invite`,
        {
          token,
          password,
        },
      );

      const data = res?.data?.data;

      // 🔥 Auto login
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));

      // 🔥 Redirect
      window.location.href = "vendor/dashboard";
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to accept invite",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F8F5F2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 420,
          p: 3,
          borderRadius: 2,
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
        }}
      >
        <Typography
          sx={{
            fontSize: 22,
            fontWeight: 700,
            color: "#2D2A26",
          }}
        >
          Set Your Password
        </Typography>

        <Typography
          sx={{
            mt: 0.5,
            fontSize: 13,
            color: "#8F8A84",
          }}
        >
          Create your password to activate your account
        </Typography>

        <Stack spacing={1.5} sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Password"
            type="password"
            size="small"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <TextField
            label="Confirm Password"
            type="password"
            size="small"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              mt: 1,
              height: 40,
              bgcolor: "#8D7B72",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": {
                bgcolor: "#7D6B63",
              },
            }}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ color: "#fff" }} />
            ) : (
              "Set Password & Continue"
            )}
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}
