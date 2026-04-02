import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  CheckCircleOutlineOutlined,
  LockOutlined,
  ShieldOutlined,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { acceptInviteApi } from "../../api/auth.api";
import { useAuth } from "../../auth/AuthContext";

export default function AcceptInvitePage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  const { login } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checklist = useMemo(
    () => [
      "Your vendor account will be activated immediately",
      "You will be redirected straight to your vendor dashboard",
      "After logout, you can sign in from the same shared login page",
    ],
    [],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("Invite token is missing or invalid");
      return;
    }

    if (!password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const res = await acceptInviteApi({
        token,
        password,
      });

      const data = res?.data || res;
      login(data);

      if (data?.user?.role === "VENDOR_OWNER") {
        navigate("/vendor/dashboard", { replace: true });
        return;
      }

      navigate("/login", { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
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
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "1.02fr 0.98fr" },
        bgcolor: "#F4EEE8",
      }}
    >
      <Box
        sx={{
          display: { xs: "none", lg: "flex" },
          position: "relative",
          alignItems: "center",
          justifyContent: "center",
          px: 7,
          py: 6,
          background:
            "linear-gradient(180deg, rgba(32, 27, 24, 0.24) 0%, rgba(32, 27, 24, 0.58) 100%), url('/login-bg.jpg') center/cover no-repeat",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(8,10,15,0.28) 100%)",
          }}
        />

        <Box sx={{ position: "relative", width: "100%", maxWidth: 540, color: "#fff" }}>
          <Box
            component="img"
            src="/logo.png"
            alt="LaFloridians"
            sx={{ width: 230, objectFit: "contain", mb: 5.5 }}
          />

          <Typography
            sx={{
              fontSize: { lg: 42, xl: 48 },
              lineHeight: 1.08,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "#FFFFFF",
            }}
          >
            Finish setting up
            <br />
            <Box component="span" sx={{ color: "#9EA2FF" }}>
              your vendor account.
            </Box>
          </Typography>

          <Typography
            sx={{
              mt: 2.5,
              maxWidth: 470,
              fontSize: 14.5,
              lineHeight: 1.72,
              color: "rgba(255,255,255,0.82)",
            }}
          >
            Create a secure password to activate your invite and access your
            vendor dashboard in FieldWork Cam.
          </Typography>

          <Stack spacing={1.2} sx={{ mt: 3.8, maxWidth: 430 }}>
            {checklist.map((item) => (
              <Stack key={item} direction="row" spacing={1} alignItems="center">
                <CheckCircleOutlineOutlined sx={{ fontSize: 18, color: "#C7F9D4" }} />
                <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.84)" }}>
                  {item}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 3, md: 4 },
          background: "linear-gradient(180deg, #F5EFEB 0%, #F4EEE8 100%)",
        }}
      >
        <Card
          sx={{
            width: "100%",
            maxWidth: 472,
            borderRadius: 1.5,
            border: "1px solid #EEE5DE",
            boxShadow: "0 26px 54px rgba(49, 34, 18, 0.08)",
            bgcolor: "#FFFFFF",
          }}
        >
          <CardContent sx={{ p: { xs: 2.8, sm: 4 } }}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  bgcolor: "#F2EAE4",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <LockOutlined sx={{ color: "#8D7B72", fontSize: 18 }} />
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 20, sm: 22 },
                    fontWeight: 700,
                    color: "#1F2937",
                    lineHeight: 1,
                  }}
                >
                  Set Your Password
                </Typography>
                <Typography
                  sx={{
                    mt: 0.55,
                    color: "#8F8A84",
                    fontSize: 12.5,
                    fontWeight: 500,
                  }}
                >
                  Create your password to activate your vendor account.
                </Typography>
              </Box>
            </Stack>

            <Box
              sx={{
                display: { xs: "block", lg: "none" },
                mt: 2.2,
                p: 1.45,
                borderRadius: 1,
                bgcolor: "#FBF6F2",
                border: "1px solid #EFE4DB",
              }}
            >
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1F2937" }}>
                FieldWork Cam
              </Typography>
              <Typography
                sx={{
                  mt: 0.4,
                  fontSize: 11.5,
                  lineHeight: 1.7,
                  color: "#8F8A84",
                }}
              >
                Set a secure password once, then continue directly into your vendor dashboard.
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2.6 }}>
              <Stack spacing={1.9}>
                {error ? (
                  <Alert severity="error" sx={{ borderRadius: 1 }}>
                    {error}
                  </Alert>
                ) : null}

                <TextField
                  fullWidth
                  size="small"
                  label="Password"
                  placeholder="Create your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? "text" : "password"}
                  sx={fieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined sx={{ fontSize: 17, color: "#B0AAA4" }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((prev) => !prev)}
                          edge="end"
                          size="small"
                          sx={{ color: "#A39D96" }}
                        >
                          {showPassword ? (
                            <VisibilityOff sx={{ fontSize: 17 }} />
                          ) : (
                            <Visibility sx={{ fontSize: 17 }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  type={showConfirmPassword ? "text" : "password"}
                  sx={fieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ShieldOutlined sx={{ fontSize: 17, color: "#B0AAA4" }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          edge="end"
                          size="small"
                          sx={{ color: "#A39D96" }}
                        >
                          {showConfirmPassword ? (
                            <VisibilityOff sx={{ fontSize: 17 }} />
                          ) : (
                            <Visibility sx={{ fontSize: 17 }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: "#FBF8F5",
                    border: "1px solid #EEE4DC",
                  }}
                >
                  <Typography
                    sx={{ fontSize: 11.5, color: "#8F8A84", lineHeight: 1.7 }}
                  >
                    Use at least 6 characters. Once your password is saved, your
                    invite will be activated and you&apos;ll be redirected to the vendor dashboard.
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    mt: 0.35,
                    py: 1.15,
                    minHeight: 46,
                    fontSize: 13,
                    fontWeight: 700,
                    borderRadius: 1,
                    bgcolor: "#8D7B72",
                    boxShadow: "0 12px 26px rgba(141, 123, 114, 0.20)",
                    textTransform: "none",
                    "&:hover": {
                      bgcolor: "#7D6B63",
                      boxShadow: "0 12px 26px rgba(125, 107, 99, 0.24)",
                    },
                  }}
                >
                  {loading ? "Activating Account..." : "Set Password & Continue"}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

const fieldSx = {
  "& .MuiInputLabel-root": {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: 500,
  },
  "& .MuiOutlinedInput-root": {
    borderRadius: 1,
    backgroundColor: "#FFFFFF",
    minHeight: 44,
    fontSize: 12.5,
    color: "#374151",
    "& fieldset": {
      borderColor: "#E7E0DA",
    },
    "&:hover fieldset": {
      borderColor: "#DDD4CC",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#D0C0B5",
      borderWidth: "1px",
    },
  },
};
