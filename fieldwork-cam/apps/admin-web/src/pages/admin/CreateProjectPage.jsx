import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import {
  AddPhotoAlternateOutlined,
  CalendarMonthOutlined,
  DescriptionOutlined,
  LocationOnOutlined,
  PersonOutlineOutlined,
  WorkOutlineOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { createProjectApi } from "../../api/project.api";
import { getServicesApi } from "../../api/service.api";
import { getVendorsApi } from "../../api/vendor.api";

function generateWorkOrderNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `WO-${y}${m}${d}-${rand}`;
}

export default function CreateProjectPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    clientName: "",
    serviceId: "",
    serviceType: "",
    assignedVendorAuthUserId: "",
    dueDate: "",
    address: "",
    description: "",
    latitude: "",
    longitude: "",
    checklist: [],
  });

  const [coverImage, setCoverImage] = useState(null);
  const [attachments, setAttachments] = useState([]);

  const [services, setServices] = useState([]);
  const [vendors, setVendors] = useState([]);

  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const completedCount = useMemo(
    () => form.checklist.filter((item) => item.completed).length,
    [form.checklist],
  );

  const fetchDependencies = async () => {
    try {
      setPageLoading(true);
      setError("");

      const [servicesRes, vendorsRes] = await Promise.all([
        getServicesApi(),
        getVendorsApi(),
      ]);

      const servicesData = servicesRes?.data || servicesRes || [];
      const vendorsData = vendorsRes?.data || vendorsRes || [];

      setServices(Array.isArray(servicesData) ? servicesData : []);
      setVendors(Array.isArray(vendorsData) ? vendorsData : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load services or vendors",
      );
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleServiceChange = (event) => {
    const nextServiceId = event.target.value;
    const service = services.find(
      (item) => (item._id || item.id) === nextServiceId,
    );

    const checklistFromService = Array.isArray(service?.photoChecklist)
      ? service.photoChecklist.map((item, index) => ({
          id: `${item.title}-${index}`,
          title: item.title,
          required: Boolean(item.required),
          captureType: item.captureType || "STANDARD",
          completed: false,
        }))
      : [];

    setForm((prev) => ({
      ...prev,
      serviceId: nextServiceId,
      serviceType: service?.name || "",
      checklist: checklistFromService,
    }));
  };

  const handleVendorChange = (event) => {
    setForm((prev) => ({
      ...prev,
      assignedVendorAuthUserId: event.target.value,
    }));
  };

  const toggleChecklist = (id) => {
    setForm((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      if (!form.title.trim()) throw new Error("Project name is required");
      if (!form.address.trim()) throw new Error("Location is required");
      if (!form.serviceId) throw new Error("Service type is required");

      const payload = new FormData();

      payload.append("workOrderNumber", generateWorkOrderNumber());
      payload.append("title", form.title);
      payload.append("address", form.address);
      payload.append("serviceType", form.serviceType);
      payload.append("serviceId", form.serviceId);
      payload.append("clientName", form.clientName);
      payload.append("assignedVendorAuthUserId", form.assignedVendorAuthUserId);
      payload.append("dueDate", form.dueDate || "");
      payload.append("description", form.description || "");
      payload.append("latitude", form.latitude || "");
      payload.append("longitude", form.longitude || "");

      if (coverImage) {
        payload.append("coverImage", coverImage);
      }

      attachments.forEach((file) => {
        payload.append("attachments", file);
      });

      await createProjectApi(payload);
      navigate("/admin/projects");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create project",
      );
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: 320 }}
        spacing={2}
      >
        <CircularProgress />
        <Typography color="text.secondary">
          Loading project dependencies...
        </Typography>
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        px: { xs: 1.5, md: 2 },
        py: { xs: 1.5, md: 2 },
        bgcolor: "#F8F5F2",
        minHeight: "100%",
      }}
    >
      {/* ── Page header ── */}
      <Typography
        sx={{
          fontSize: 28,
          fontWeight: 700,
          color: "#1F2937",
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
        }}
      >
        Create New Project
      </Typography>

      <Typography
        sx={{
          mt: 0.5,
          color: "#9CA3AF",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        Initiate a new operational site by filling out the details below.
      </Typography>

      {/* ── Form sections ── */}
      <Stack spacing={1.5} sx={{ mt: 2.25 }}>
        {/* General Information */}
        <Card
          sx={{
            p: 2,
            borderRadius: 1,
            border: "1px solid #E9E1DB",
            boxShadow: "none",
            bgcolor: "#FFFFFF",
          }}
        >
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 700,
              color: "#1F2937",
              lineHeight: 1.2,
              mb: 2,
            }}
          >
            General Information
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Project Name"
                value={form.title}
                onChange={handleChange("title")}
                InputProps={{
                  startAdornment: (
                    <Box
                      sx={{
                        mr: 1,
                        display: "flex",
                        alignItems: "center",
                        color: "#9CA3AF",
                      }}
                    >
                      <DescriptionOutlined sx={{ fontSize: 18 }} />
                    </Box>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Client"
                value={form.clientName}
                onChange={handleChange("clientName")}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Service Type"
                value={form.serviceId}
                onChange={handleServiceChange}
              >
                {services.map((service) => (
                  <MenuItem
                    key={service._id || service.id}
                    value={service._id || service.id}
                  >
                    {service.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Card>

        {/* Operational Details */}
        <Card
          sx={{
            p: 2,
            borderRadius: 1,
            border: "1px solid #E9E1DB",
            boxShadow: "none",
            bgcolor: "#FFFFFF",
          }}
        >
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 700,
              color: "#1F2937",
              lineHeight: 1.2,
              mb: 2,
            }}
          >
            Operational Details
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Assigned Vendor"
                value={form.assignedVendorAuthUserId}
                onChange={handleVendorChange}
                InputProps={{
                  startAdornment: (
                    <Box
                      sx={{
                        mr: 1,
                        display: "flex",
                        alignItems: "center",
                        color: "#9CA3AF",
                      }}
                    >
                      <PersonOutlineOutlined sx={{ fontSize: 18 }} />
                    </Box>
                  ),
                }}
              >
                {vendors.map((vendor) => (
                  <MenuItem
                    key={vendor.authUserId || vendor._id || vendor.id}
                    value={vendor.authUserId || vendor._id || vendor.id}
                  >
                    {vendor.companyName || vendor.fullName || "Unnamed Vendor"}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Deadline"
                value={form.dueDate}
                onChange={handleChange("dueDate")}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <Box
                      sx={{
                        mr: 1,
                        display: "flex",
                        alignItems: "center",
                        color: "#9CA3AF",
                      }}
                    >
                      <CalendarMonthOutlined sx={{ fontSize: 18 }} />
                    </Box>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Location"
                value={form.address}
                onChange={handleChange("address")}
                InputProps={{
                  startAdornment: (
                    <Box
                      sx={{
                        mr: 1,
                        display: "flex",
                        alignItems: "center",
                        color: "#9CA3AF",
                      }}
                    >
                      <LocationOnOutlined sx={{ fontSize: 18 }} />
                    </Box>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Latitude"
                value={form.latitude}
                onChange={handleChange("latitude")}
                placeholder="e.g. 45.5231"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Longitude"
                value={form.longitude}
                onChange={handleChange("longitude")}
                placeholder="e.g. -122.6765"
              />
            </Grid>
          </Grid>
        </Card>

        {/* Photo Checklist */}
        <Card
          sx={{
            p: 2,
            borderRadius: 1,
            border: "1px solid #E9E1DB",
            boxShadow: "none",
            bgcolor: "#FFFFFF",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={1.5}
          >
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 700,
                color: "#1F2937",
                lineHeight: 1.2,
              }}
            >
              Photo Checklist
            </Typography>
            <Typography
              sx={{ fontSize: 12.5, color: "#9CA3AF", fontWeight: 500 }}
            >
              {completedCount} of {form.checklist.length} completed
            </Typography>
          </Stack>

          {form.serviceId ? (
            <Stack spacing={0.6}>
              {form.checklist.length ? (
                form.checklist.map((item) => (
                  <FormControlLabel
                    key={item.id}
                    control={
                      <Checkbox
                        checked={item.completed}
                        onChange={() => toggleChecklist(item.id)}
                        size="small"
                      />
                    }
                    label={
                      <Box>
                        <Typography sx={{ fontSize: 13, color: "#374151" }}>
                          {item.title}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 11,
                            color: "#9CA3AF",
                            textTransform: "uppercase",
                            fontWeight: 700,
                          }}
                        >
                          {item.required ? "Required" : "Optional"} •{" "}
                          {item.captureType?.replaceAll("_", " ")}
                        </Typography>
                      </Box>
                    }
                    sx={{ m: 0 }}
                  />
                ))
              ) : (
                <Typography sx={{ fontSize: 13, color: "#B0B5BE" }}>
                  Selected service has no checklist requirements
                </Typography>
              )}
            </Stack>
          ) : (
            <Typography sx={{ fontSize: 13, color: "#B0B5BE" }}>
              Select a service type to load its checklist
            </Typography>
          )}

          <Button
            component="label"
            variant="outlined"
            startIcon={<AddPhotoAlternateOutlined />}
            sx={{
              mt: 2,
              borderRadius: 1,
              borderColor: "#E9E1DB",
              color: "#6B7280",
              textTransform: "none",
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            Upload Cover Image
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
            />
          </Button>

          {coverImage ? (
            <Typography sx={{ mt: 1, fontSize: 12, color: "#6B7280" }}>
              Selected: {coverImage.name}
            </Typography>
          ) : null}
        </Card>

        {/* Project Description */}
        <Card
          sx={{
            p: 2,
            borderRadius: 1,
            border: "1px solid #E9E1DB",
            boxShadow: "none",
            bgcolor: "#FFFFFF",
          }}
        >
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 700,
              color: "#1F2937",
              lineHeight: 1.2,
              mb: 2,
            }}
          >
            Project Description
          </Typography>

          <TextField
            fullWidth
            multiline
            minRows={6}
            label="Description & Notes"
            placeholder="Provide detailed project requirements, milestones, and specific operational instructions..."
            value={form.description}
            onChange={handleChange("description")}
          />

          <Button
            component="label"
            variant="outlined"
            startIcon={<WorkOutlineOutlined />}
            sx={{
              mt: 2,
              borderRadius: 1,
              borderColor: "#E9E1DB",
              color: "#6B7280",
              textTransform: "none",
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            Add Attachments
            <input
              type="file"
              hidden
              multiple
              onChange={(e) => setAttachments(Array.from(e.target.files || []))}
            />
          </Button>

          {attachments.length ? (
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {attachments.map((file, index) => (
                <Typography
                  key={`${file.name}-${index}`}
                  sx={{ fontSize: 12, color: "#6B7280" }}
                >
                  {file.name}
                </Typography>
              ))}
            </Stack>
          ) : null}
        </Card>

        {error ? <Alert severity="error">{error}</Alert> : null}

        {/* ── Footer actions ── */}
        <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
          <Button
            variant="text"
            onClick={() => navigate("/admin/projects")}
            sx={{
              color: "#6B7280",
              borderRadius: 1,
              textTransform: "none",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              borderRadius: 1,
              minWidth: 150,
              bgcolor: "#8D7B72",
              textTransform: "none",
              fontSize: 13,
              fontWeight: 600,
              boxShadow: "none",
              "&:hover": { bgcolor: "#7D6B63", boxShadow: "none" },
            }}
          >
            {loading ? "Initiating..." : "Initiate Project"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
