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
  CloudOutlined,
  EmailOutlined,
  GroupsOutlined,
  LocationOnOutlined,
  LockOutlined,
  ShieldOutlined,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { loginEmailApi } from "../../api/auth.api";
import { useAuth } from "../../auth/AuthContext";

const featureItems = [
  {
    icon: <LocationOnOutlined sx={{ fontSize: 16 }} />,
    label: "Geo-Tagged Photos",
  },
  {
    icon: <CloudOutlined sx={{ fontSize: 16 }} />,
    label: "Secure Cloud Storage",
  },
  { icon: <GroupsOutlined sx={{ fontSize: 16 }} />, label: "Team Management" },
];

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
        gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
        bgcolor: "#F5F1EC",
      }}
    >
      <Box
        sx={{
          position: "relative",
          display: { xs: "none", lg: "flex" },
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          backgroundImage:
            "linear-gradient(rgba(27,31,42,0.46), rgba(27,31,42,0.58)), url('/login-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          px: 6,
          py: 5,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.18) 100%)",
          }}
        />

        <Box
          sx={{
            position: "relative",
            width: "100%",
            maxWidth: 560,
            color: "#fff",
            mb: 6,
          }}
        >
          <Box
            component="img"
            src="/logo.png"
            alt="LaFloridians"
            sx={{
              width: 350,
              objectFit: "contain",
              mb: 0.5,
              ml: 6,
            }}
          />

          <Typography
            sx={{
              fontSize: { lg: 46, xl: 52 },
              lineHeight: 1.05,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "#FFFFFF",
            }}
          >
            Capture. Document.
            <br />
            <Box component="span" sx={{ color: "#9EA2FF" }}>
              Deliver.
            </Box>
          </Typography>

          <Typography
            sx={{
              mt: 2.5,
              maxWidth: 470,
              fontSize: 14.5,
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.84)",
            }}
          >
            Empower your field teams with intelligent photo documentation.
            Streamline property inspections with geo-tagged imagery and
            real-time reporting.
          </Typography>

          <Stack
            direction="row"
            flexWrap="wrap"
            gap={1.05}
            sx={{ mt: 3.2, maxWidth: 430 }}
          >
            {featureItems.map((item) => (
              <FeatureChip
                key={item.label}
                icon={item.icon}
                label={item.label}
              />
            ))}
          </Stack>

          <Stack
            direction="row"
            spacing={4}
            sx={{ mt: 4.8, flexWrap: "wrap", rowGap: 2.2 }}
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
          background: "linear-gradient(180deg, #F4EFEA 0%, #F7F2EE 100%)",
        }}
      >
        <Card
          sx={{
            width: "100%",
            maxWidth: 445,
            borderRadius: 1.5,
            border: "1px solid #ECE4DD",
            boxShadow: "0 24px 50px rgba(31, 41, 55, 0.08)",
            bgcolor: "#FFFFFF",
          }}
        >
          <CardContent sx={{ p: { xs: 2.8, sm: 3.4 } }}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  bgcolor: "#EEF2FF",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <LockOutlined sx={{ color: "#5B5BFF", fontSize: 17 }} />
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: { xs: 20, sm: 22 },
                    fontWeight: 700,
                    color: "#1F2937",
                    lineHeight: 3,
                  }}
                >
                  Sign In
                </Typography>
                <Typography
                  sx={{
                    mt: 0.55,
                    color: "#8F8A84",
                    fontSize: 12.5,
                    fontWeight: 500,
                  }}
                >
                  Sign in to your dashboard
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
              <Typography
                sx={{ fontSize: 13, fontWeight: 700, color: "#1F2937" }}
              >
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
                Empower your field teams with intelligent photo documentation.
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2.4 }}>
              <Stack spacing={1.8}>
                <TextField
                  fullWidth
                  size="small"
                  label="Email Address"
                  placeholder="admin@fieldworkcam.com"
                  value={form.email}
                  onChange={handleChange("email")}
                  type="email"
                  sx={fieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlined
                          sx={{ fontSize: 17, color: "#B0AAA4" }}
                        />
                      </InputAdornment>
                    ),
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
                        sx={{ color: "#C8B8AC" }}
                      />
                    }
                    label="Remember me"
                    sx={{
                      m: 0,
                      "& .MuiFormControlLabel-label": {
                        fontSize: 12.5,
                        color: "#8F8A84",
                      },
                    }}
                  />

                  <Link
                    component="button"
                    type="button"
                    underline="none"
                    sx={{
                      color: "#4F37F4",
                      fontWeight: 700,
                      fontSize: 12.5,
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
                      borderRadius: 1,
                      fontSize: 12.5,
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
                    mt: 0.2,
                    py: 1.15,
                    minHeight: 44,
                    fontSize: 13,
                    fontWeight: 700,
                    borderRadius: 1,
                    bgcolor: "#4F37F4",
                    boxShadow: "0 10px 24px rgba(79, 55, 244, 0.24)",
                    "&:hover": {
                      bgcolor: "#452FE0",
                      boxShadow: "0 10px 24px rgba(69, 47, 224, 0.26)",
                    },
                  }}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>

                <Box sx={{ pt: 0.85 }}>
                  <Typography
                    align="center"
                    sx={{
                      fontSize: 10.5,
                      letterSpacing: "0.1em",
                      fontWeight: 800,
                      color: "#A39D96",
                    }}
                  >
                    SECURED ACCESS
                  </Typography>

                  <Box
                    sx={{
                      mt: 1.3,
                      display: "flex",
                      gap: 1,
                      alignItems: "flex-start",
                      bgcolor: "#F6F7FF",
                      borderRadius: 1,
                      p: 1.45,
                      border: "1px solid #E8EBFF",
                    }}
                  >
                    <ShieldOutlined
                      sx={{ color: "#5B5BFF", mt: "2px", fontSize: 17 }}
                    />
                    <Typography
                      sx={{
                        fontSize: 12,
                        lineHeight: 1.6,
                        color: "#6D6EE6",
                      }}
                    >
                      This portal is restricted to authorized users. All login
                      activity is monitored and logged.
                    </Typography>
                  </Box>
                </Box>

                <Typography
                  align="center"
                  sx={{ pt: 0.25, fontSize: 11.5, color: "#B0AAA4" }}
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
        gap: 0.75,
        px: 1.25,
        py: 0.75,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.10)",
        border: "1px solid rgba(255,255,255,0.18)",
        color: "#fff",
        backdropFilter: "blur(8px)",
        fontSize: 11.5,
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
    <Box sx={{ minWidth: 120 }}>
      <Typography
        sx={{
          fontSize: 26,
          fontWeight: 800,
          lineHeight: 1,
          color: "#fff",
        }}
      >
        {value}
      </Typography>
      <Typography
        sx={{
          mt: 0.75,
          fontSize: 12,
          color: "rgba(255,255,255,0.78)",
        }}
      >
        {label}
      </Typography>
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
