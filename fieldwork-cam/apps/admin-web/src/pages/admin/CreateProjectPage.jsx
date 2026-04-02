import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  CircularProgress,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AddPhotoAlternateOutlined,
  AttachFileOutlined,
  CalendarMonthOutlined,
  LocationOnOutlined,
  PersonOutlineOutlined,
} from "@mui/icons-material";
import { createProjectApi } from "../../api/project.api";
import { getServicesApi } from "../../api/service.api";
import { getVendorsApi } from "../../api/vendor.api";

const generateWorkOrderNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);

  return `PRJ-${year}${month}${day}-${random}`;
};

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
    priority: "Medium",
    checklist: [],
  });
  const [referencePhotos, setReferencePhotos] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [services, setServices] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        setPageLoading(true);
        setError("");

        const [servicesResponse, vendorsResponse] = await Promise.all([
          getServicesApi(),
          getVendorsApi(),
        ]);

        const serviceData = servicesResponse?.data || servicesResponse || [];
        const vendorData = vendorsResponse?.data || vendorsResponse || [];

        setServices(Array.isArray(serviceData) ? serviceData : []);
        setVendors(Array.isArray(vendorData) ? vendorData : []);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            "Failed to load project dependencies",
        );
      } finally {
        setPageLoading(false);
      }
    };

    fetchDependencies();
  }, []);

  const completedCount = useMemo(
    () => form.checklist.filter((item) => item.completed).length,
    [form.checklist],
  );

  const handleFieldChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleServiceChange = (event) => {
    const nextServiceId = event.target.value;
    const selectedService = services.find(
      (service) => (service._id || service.id) === nextServiceId,
    );

    const checklist = Array.isArray(selectedService?.photoChecklist)
      ? selectedService.photoChecklist.map((item, index) => ({
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
      serviceType: selectedService?.name || "",
      checklist,
    }));
  };

  const toggleChecklist = (itemId) => {
    setForm((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item,
      ),
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError("");

      if (!form.title.trim()) throw new Error("Project name is required");
      if (!form.clientName.trim()) throw new Error("Client is required");
      if (!form.serviceId) throw new Error("Service type is required");
      if (!form.assignedVendorAuthUserId) {
        throw new Error("Assigned vendor is required");
      }
      if (!form.address.trim()) throw new Error("Location is required");

      await createProjectApi({
        workOrderNumber: generateWorkOrderNumber(),
        title: form.title.trim(),
        clientName: form.clientName.trim(),
        serviceId: form.serviceId,
        serviceType: form.serviceType,
        assignedVendorAuthUserId: form.assignedVendorAuthUserId,
        dueDate: form.dueDate || null,
        address: form.address.trim(),
        description: form.description.trim(),
        priority: form.priority,
        coverImageUrl: referencePhotos[0]?.name || "",
        attachments: [
          ...referencePhotos.map((file) => file.name),
          ...attachments.map((file) => file.name),
        ],
        checklist: form.checklist.map((item) => ({
          title: item.title,
          required: item.required,
          captureType: item.captureType,
          completed: item.completed,
        })),
      });

      navigate("/admin/projects");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to create project",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 320 }} spacing={2}>
        <CircularProgress />
        <Typography sx={{ fontSize: 13, color: "#8E8882" }}>
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
      <Typography sx={{ mt: 0.45, color: "#9CA3AF", fontSize: 13, fontWeight: 500 }}>
        Initiate a new operation site by filling out the details below. All fields marked with * are required.
      </Typography>

      <Stack spacing={1.5} sx={{ mt: 2 }}>
        <SectionCard title="General Information">
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Project Name *"
                placeholder="e.g., Q4 Logistics Optimization"
                value={form.title}
                onChange={handleFieldChange("title")}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Client *"
                placeholder="Select or enter client name"
                value={form.clientName}
                onChange={handleFieldChange("clientName")}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Service Type *"
                value={form.serviceId}
                onChange={handleServiceChange}
                sx={fieldSx}
              >
                {services.map((service) => (
                  <MenuItem key={service._id || service.id} value={service._id || service.id}>
                    {service.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </SectionCard>

        <SectionCard title="Operational Details">
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Assigned Vendor *"
                value={form.assignedVendorAuthUserId}
                onChange={handleFieldChange("assignedVendorAuthUserId")}
                sx={fieldSx}
                InputProps={{
                  startAdornment: (
                    <Box sx={startAdornmentSx}>
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
                label="Deadline *"
                value={form.dueDate}
                onChange={handleFieldChange("dueDate")}
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}
                InputProps={{
                  startAdornment: (
                    <Box sx={startAdornmentSx}>
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
                label="Location *"
                placeholder="San Francisco, CA (or search map)"
                value={form.address}
                onChange={handleFieldChange("address")}
                sx={fieldSx}
                InputProps={{
                  startAdornment: (
                    <Box sx={startAdornmentSx}>
                      <LocationOnOutlined sx={{ fontSize: 18 }} />
                    </Box>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={mapPreviewSx}>
                <LocationOnOutlined sx={{ fontSize: 20, color: "#D0C4BB" }} />
                <Typography sx={{ mt: 0.6, fontSize: 11.5, color: "#BBB1A9", fontWeight: 500 }}>
                  Interactive map preview for selected location
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </SectionCard>

        <SectionCard
          title="Photo Checklist"
          rightText={`${completedCount} of ${form.checklist.length} completed`}
        >
          <Stack spacing={0.3}>
            {form.checklist.length ? (
              form.checklist.map((item) => (
                <Stack
                  key={item.id}
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ py: 0.2 }}
                >
                  <Checkbox
                    checked={item.completed}
                    onChange={() => toggleChecklist(item.id)}
                    size="small"
                    sx={{ color: "#D1C7BF" }}
                  />
                  <Box>
                    <Typography sx={{ fontSize: 12.5, color: "#3E3A36", fontWeight: 500 }}>
                      {item.title}
                    </Typography>
                    <Typography sx={{ fontSize: 10.5, color: "#ABA49D" }}>
                      {item.captureType.replaceAll("_", " ")}
                      {item.required ? " • Required" : ""}
                    </Typography>
                  </Box>
                </Stack>
              ))
            ) : (
              <Typography sx={{ fontSize: 12.5, color: "#B0B5BE" }}>
                Select a service type to load checklist items.
              </Typography>
            )}
          </Stack>

          <Button component="label" variant="outlined" startIcon={<AddPhotoAlternateOutlined />} sx={uploadButtonSx}>
            Upload Photos
            <input
              type="file"
              hidden
              accept="image/*"
              multiple
              onChange={(event) => {
                setReferencePhotos(Array.from(event.target.files || []));
              }}
            />
          </Button>

          <Typography sx={helperTextSx}>
            Selected photo names are saved with the project brief for reference.
          </Typography>

          {referencePhotos.length ? (
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
              {referencePhotos.map((file) => (
                <Box key={file.name} sx={filePillSx}>
                  {file.name}
                </Box>
              ))}
            </Stack>
          ) : null}
        </SectionCard>

        <SectionCard title="Project Description">
          <TextField
            fullWidth
            multiline
            minRows={5}
            label="Description & Notes"
            placeholder="Provide detailed project requirements, milestones, and specific operational instructions..."
            value={form.description}
            onChange={handleFieldChange("description")}
            sx={multilineFieldSx}
          />

          <Button component="label" variant="outlined" startIcon={<AttachFileOutlined />} sx={uploadButtonSx}>
            Add Attachments
            <input
              type="file"
              hidden
              multiple
              onChange={(event) => {
                setAttachments(Array.from(event.target.files || []));
              }}
            />
          </Button>

          <Typography sx={helperTextSx}>
            Accepted file names are stored with the project record for the admin workflow.
          </Typography>

          {attachments.length ? (
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
              {attachments.map((file) => (
                <Box key={file.name} sx={filePillSx}>
                  {file.name}
                </Box>
              ))}
            </Stack>
          ) : null}
        </SectionCard>

        {error ? (
          <Alert severity="error" sx={{ borderRadius: 1 }}>
            {error}
          </Alert>
        ) : null}

        <Stack direction="row" justifyContent="flex-end" spacing={1.25}>
          <Button onClick={() => navigate("/admin/projects")} sx={cancelButtonSx}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} sx={submitButtonSx}>
            {submitting ? "Initiating..." : "Initiate Project"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

function SectionCard({ title, rightText, children }) {
  return (
    <Card
      sx={{
        p: 2,
        borderRadius: 1,
        border: "1px solid #E9E1DB",
        boxShadow: "none",
        bgcolor: "#FFFFFF",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.8 }}>
        <Typography sx={{ fontSize: 15.5, fontWeight: 700, color: "#1F2937" }}>
          {title}
        </Typography>
        {rightText ? (
          <Typography sx={{ fontSize: 11.5, color: "#A39D96", fontWeight: 500 }}>
            {rightText}
          </Typography>
        ) : null}
      </Stack>
      {children}
    </Card>
  );
}

const fieldSx = {
  "& .MuiInputLabel-root": {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: 500,
  },
  "& .MuiInputBase-root": {
    minHeight: 40,
    borderRadius: 1,
    bgcolor: "#FFFFFF",
    fontSize: 12.5,
    color: "#374151",
    fontWeight: 500,
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#E3DDD7",
  },
  "& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#DDD4CC",
  },
  "& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#D5C6BA",
    borderWidth: "1px",
  },
};

const multilineFieldSx = {
  ...fieldSx,
  "& .MuiInputBase-root": {
    minHeight: 140,
    alignItems: "flex-start",
    borderRadius: 1,
    bgcolor: "#FFFFFF",
    fontSize: 12.5,
    color: "#374151",
    fontWeight: 500,
  },
};

const startAdornmentSx = {
  mr: 1,
  display: "flex",
  alignItems: "center",
  color: "#9CA3AF",
};

const mapPreviewSx = {
  minHeight: 108,
  borderRadius: 1,
  border: "1px solid #E9E1DB",
  bgcolor: "#F7F4F1",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
};

const uploadButtonSx = {
  mt: 1.8,
  width: "100%",
  minHeight: 36,
  borderRadius: 1,
  borderColor: "#E9E1DB",
  color: "#6B7280",
  textTransform: "none",
  fontSize: 12.5,
  fontWeight: 600,
  boxShadow: "none",
  "&:hover": {
    borderColor: "#DED3CB",
    bgcolor: "#FCFAF8",
    boxShadow: "none",
  },
};

const helperTextSx = {
  mt: 0.8,
  fontSize: 10.5,
  color: "#B0B5BE",
};

const filePillSx = {
  px: 1,
  py: 0.55,
  borderRadius: 1,
  bgcolor: "#F5EFEB",
  color: "#736D67",
  fontSize: 11,
  fontWeight: 500,
};

const cancelButtonSx = {
  color: "#6B7280",
  borderRadius: 1,
  textTransform: "none",
  fontSize: 13,
  fontWeight: 600,
};

const submitButtonSx = {
  borderRadius: 1,
  minWidth: 154,
  bgcolor: "#8D7B72",
  color: "#FFFFFF",
  textTransform: "none",
  fontSize: 13,
  fontWeight: 600,
  boxShadow: "none",
  "&:hover": { bgcolor: "#7D6B63", boxShadow: "none" },
  "&.Mui-disabled": { bgcolor: "#D7CDC6", color: "#8F8A84" },
};
