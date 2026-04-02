import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  EmailOutlined,
  LockOutlined,
  Visibility,
  VisibilityOff,
  ShieldOutlined,
  LocationOnOutlined,
  CloudOutlined,
  GroupsOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { loginEmailApi } from "../../api/auth.api";
import { useAuth } from "../../auth/AuthContext";

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;

    if (user?.role === "ADMIN") {
      navigate("/admin/dashboard");
      return;
    }

    if (user?.role === "VENDOR_OWNER") {
      navigate("/vendor/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("remember_email");
    if (rememberedEmail) {
      setForm((prev) => ({
        ...prev,
        email: rememberedEmail,
        rememberMe: true,
      }));
    }
  }, []);

  const handleChange = (key) => (event) => {
    const value =
      key === "rememberMe" ? event.target.checked : event.target.value;

    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const res = await loginEmailApi({
        email: form.email,
        password: form.password,
      });

      const data = res?.data || res;
      login(data);

      if (form.rememberMe) {
        localStorage.setItem("remember_email", form.email);
      } else {
        localStorage.removeItem("remember_email");
      }

      if (data?.user?.role === "ADMIN") {
        navigate("/admin/dashboard");
        return;
      }

      if (data?.user?.role === "VENDOR_OWNER") {
        navigate("/vendor/dashboard");
        return;
      }

      setError("This role is not allowed on web.");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr" },
        bgcolor: "#F5F1EC",
      }}
    >
      <Box
        sx={{
          position: "relative",
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          justifyContent: "center",
          backgroundImage:
            'linear-gradient(rgba(17,24,39,0.56), rgba(17,24,39,0.56)), url("/login-bg.jpg")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          px: 6,
          py: 5,
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 560, color: "#fff" }}>
          <Box
            component="img"
            src="/logo.png"
            alt="LaFloridians"
            sx={{
              width: 375,
              objectFit: "contain",
              mb: 0.5,
              ml: 5,
            }}
          />

          <Typography
            sx={{
              fontSize: { md: 42, lg: 48 },
              lineHeight: 1.3,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: "#fff",
            }}
          >
            Capture. Document.
            <br />
            <Box component="span" sx={{ color: "#8E8CFF" }}>
              Deliver.
            </Box>
          </Typography>

          <Typography
            sx={{
              mt: 2.5,
              maxWidth: 500,
              fontSize: 15,
              lineHeight: 1.75,
              color: "rgba(255,255,255,0.88)",
            }}
          >
            Empower your field teams with intelligent photo documentation.
            Streamline property inspections with geo-tagged imagery and
            real-time reporting.
          </Typography>

          <Stack direction="row" flexWrap="wrap" gap={1.25} sx={{ mt: 3 }}>
            <FeatureChip
              icon={<LocationOnOutlined sx={{ fontSize: 16 }} />}
              label="Geo-Tagged Photos"
            />
            <FeatureChip
              icon={<CloudOutlined sx={{ fontSize: 16 }} />}
              label="Secure Cloud Storage"
            />
            <FeatureChip
              icon={<GroupsOutlined sx={{ fontSize: 16 }} />}
              label="Team Management"
            />
          </Stack>

          <Stack
            direction="row"
            spacing={4}
            sx={{ mt: 4.5, flexWrap: "wrap", rowGap: 2.5 }}
          >
            <StatItem value="12K+" label="Properties Documented" />
            <StatItem value="850+" label="Active Field Workers" />
            <StatItem value="99.9%" label="Platform Uptime" />
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
        }}
      >
        <Card
          sx={{
            width: "100%",
            maxWidth: 500,
            borderRadius: 1,
            boxShadow: "0 14px 36px rgba(15, 23, 42, 0.08)",
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 3.5 } }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5, // space between icon and text
                mb: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  bgcolor: "#EEF2FF",
                  display: "grid",
                  placeItems: "center",
                  mb: 1.75,
                }}
              >
                <LockOutlined sx={{ color: "#4F46E5", fontSize: 20 }} />
              </Box>

              <Typography
                sx={{
                  fontSize: { xs: 28, sm: 32 },
                  fontWeight: 800,
                  color: "#111827",
                  mb: 2,
                }}
              >
                Sign In
              </Typography>
            </Box>

            <Typography
              sx={{
                mt: 0.75,
                color: "#6B7280",
                mb: 3,
                fontSize: 14,
              }}
            >
              Sign in to your dashboard
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Email Address"
                  placeholder="admin@fieldworkcam.com"
                  value={form.email}
                  onChange={handleChange("email")}
                  type="email"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlined sx={{ fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1,
                      backgroundColor: "#FAFAFA",
                      height: 46,
                    },
                  }}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange("password")}
                  type={showPassword ? "text" : "password"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined sx={{ fontSize: 18 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((prev) => !prev)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? (
                            <VisibilityOff sx={{ fontSize: 18 }} />
                          ) : (
                            <Visibility sx={{ fontSize: 18 }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1,
                      backgroundColor: "#FAFAFA",
                      height: 46,
                    },
                  }}
                />

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={2}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={form.rememberMe}
                        onChange={handleChange("rememberMe")}
                      />
                    }
                    label="Remember me"
                    sx={{
                      m: 0,
                      "& .MuiFormControlLabel-label": {
                        fontSize: 13,
                        color: "#6B7280",
                      },
                    }}
                  />

                  <Link
                    component="button"
                    type="button"
                    underline="none"
                    sx={{
                      color: "#4F46E5",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Forgot password?
                  </Link>
                </Stack>

                {error ? (
                  <Alert
                    severity="error"
                    sx={{
                      borderRadius: 1.5,
                      fontSize: 13,
                    }}
                  >
                    {error}
                  </Alert>
                ) : null}

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    mt: 0.5,
                    py: 1.2,
                    minHeight: 46,
                    fontSize: 14,
                    fontWeight: 800,
                    borderRadius: 1,
                    boxShadow: "0 8px 20px rgba(79, 70, 229, 0.24)",
                  }}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>

                <Box sx={{ pt: 1 }}>
                  <Typography
                    align="center"
                    sx={{
                      fontSize: 11,
                      letterSpacing: 1,
                      fontWeight: 800,
                      color: "#9CA3AF",
                    }}
                  >
                    SECURED ACCESS
                  </Typography>

                  <Box
                    sx={{
                      mt: 1.5,
                      display: "flex",
                      gap: 1.25,
                      alignItems: "flex-start",
                      bgcolor: "#F5F7FF",
                      borderRadius: 1.5,
                      p: 1.75,
                    }}
                  >
                    <ShieldOutlined
                      sx={{ color: "#4F46E5", mt: "2px", fontSize: 18 }}
                    />
                    <Typography
                      sx={{
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: "#5B5F9B",
                      }}
                    >
                      This portal is restricted to authorized users. All login
                      activity is monitored and logged.
                    </Typography>
                  </Box>
                </Box>

                <Typography
                  align="center"
                  sx={{ pt: 0.5, fontSize: 12, color: "#9CA3AF" }}
                >
                  © 2026 FieldWork Cam. All rights reserved.
                </Typography>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

function FeatureChip({ icon, label }) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.8,
        px: 1.35,
        py: 0.8,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.14)",
        border: "1px solid rgba(255,255,255,0.18)",
        color: "#fff",
        backdropFilter: "blur(8px)",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {icon}
      <span>{label}</span>
    </Box>
  );
}

function StatItem({ value, label }) {
  return (
    <Box sx={{ minWidth: 110 }}>
      <Typography
        sx={{
          fontSize: 28,
          fontWeight: 900,
          lineHeight: 1,
          color: "#fff",
        }}
      >
        {value}
      </Typography>
      <Typography
        sx={{
          mt: 0.8,
          fontSize: 12.5,
          color: "rgba(255,255,255,0.8)",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
