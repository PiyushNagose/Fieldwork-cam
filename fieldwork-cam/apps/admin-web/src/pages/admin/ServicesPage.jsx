import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AccountTreeOutlined,
  AddOutlined,
  CheckCircleOutline,
  DeleteOutlineOutlined,
  DragIndicatorOutlined,
  HelpOutlineOutlined,
  InfoOutlined,
  PhotoCameraOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  createServiceApi,
  getServicesApi,
  updateServiceApi,
} from "../../api/service.api";

const CATEGORY_OPTIONS = [
  "Maintenance",
  "Inspection",
  "Survey",
  "Documentation",
  "Audit",
];

const CAPTURE_TYPE_OPTIONS = [
  { value: "WIDE_ANGLE", label: "Wide Angle" },
  { value: "CLOSE_UP", label: "Close Up" },
  { value: "HIGH_DETAIL", label: "High Detail" },
  { value: "STANDARD", label: "Standard" },
];

const createLocalId = () => `req-${Math.random().toString(36).slice(2, 10)}`;

const formatCaptureTypeLabel = (value = "") =>
  String(value || "")
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");

export default function ServicesPage() {
  const navigate = useNavigate();
  const [serviceId, setServiceId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    category: "",
    name: "",
    basePrice: "",
    workflowLogic: "",
    requireSignature: false,
    autoApproveInvoices: false,
    notifyClientOnDispatch: false,
    photoChecklist: [],
  });

  const [newRequirement, setNewRequirement] = useState({
    title: "",
    required: true,
    captureType: "STANDARD",
  });

  const fetchService = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getServicesApi();
      const data = response?.data || response || [];
      const service = Array.isArray(data) && data.length ? data[0] : null;

      if (!service) {
        setServiceId("");
        setForm((prev) => ({
          ...prev,
          photoChecklist: [],
        }));
        return;
      }

      setServiceId(service._id || service.id || "");
      setForm({
        category: service.category || "",
        name: service.name || "",
        basePrice: service.defaultPrice ?? "",
        workflowLogic: service.workflowRules?.serviceLogic || "",
        requireSignature: Boolean(
          service.workflowRules?.requireSignatureOnCompletion,
        ),
        autoApproveInvoices: Boolean(
          service.workflowRules?.autoApproveInvoicesUnder500,
        ),
        notifyClientOnDispatch: Boolean(
          service.workflowRules?.notifyClientOnDispatch,
        ),
        photoChecklist: (service.photoChecklist || []).map((item) => ({
          title: item.title,
          required: Boolean(item.required),
          captureType: item.captureType || "STANDARD",
          id: createLocalId(),
        })),
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load configuration",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchService();
  }, []);

  const handleChange = (key) => (event) => {
    const value =
      event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRequirementChange = (id, key, value) => {
    setForm((prev) => ({
      ...prev,
      photoChecklist: prev.photoChecklist.map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const handleRemoveRequirement = (id) => {
    setForm((prev) => ({
      ...prev,
      photoChecklist: prev.photoChecklist.filter((item) => item.id !== id),
    }));
  };

  const handleAddRequirement = () => {
    if (!newRequirement.title.trim()) return;

    setForm((prev) => ({
      ...prev,
      photoChecklist: [
        ...prev.photoChecklist,
        {
          id: createLocalId(),
          title: newRequirement.title.trim(),
          required: newRequirement.required,
          captureType: newRequirement.captureType,
        },
      ],
    }));

    setNewRequirement({
      title: "",
      required: true,
      captureType: "STANDARD",
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      const payload = {
        category: form.category,
        name: form.name,
        defaultPrice: Number(form.basePrice || 0),
        workflowRules: {
          serviceLogic: form.workflowLogic,
          requireSignatureOnCompletion: form.requireSignature,
          autoApproveInvoicesUnder500: form.autoApproveInvoices,
          notifyClientOnDispatch: form.notifyClientOnDispatch,
        },
        photoChecklist: form.photoChecklist.map((item) => ({
          title: item.title,
          required: item.required,
          captureType: item.captureType,
        })),
      };

      if (serviceId) {
        await updateServiceApi(serviceId, payload);
      } else {
        const response = await createServiceApi(payload);
        setServiceId(response?.data?._id || response?._id || "");
      }

      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(
    () => ({
      category: form.category || "-",
      photosRequired: form.photoChecklist.filter((item) => item.required).length,
      processingMode: form.autoApproveInvoices ? "AUTOMATED" : "MANUAL",
    }),
    [form],
  );

  if (loading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: 360 }}
        spacing={2}
      >
        <CircularProgress sx={{ color: "#8E8175" }} />
        <Typography color="text.secondary" variant="body2">
          Loading service details...
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
      <Box sx={{ maxWidth: 1240 }}>
        <Typography
          sx={{
            fontSize: 28,
            fontWeight: 700,
            color: "#1F2937",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}
        >
          Service Details
        </Typography>
        <Typography
          sx={{ mt: 0.45, color: "#9CA3AF", fontSize: 13, fontWeight: 500 }}
        >
          Define the core rules, pricing, and required documentation for this service.
        </Typography>

        <Stack
          direction="row"
          justifyContent="flex-end"
          spacing={1.2}
          sx={{ mt: 1.55 }}
        >
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
            sx={cancelButtonSx}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={saveButtonSx}
          >
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </Stack>

        {error ? (
          <Alert severity="error" sx={{ mt: 1.5, borderRadius: 1 }}>
            {error}
          </Alert>
        ) : null}

        <Box
          sx={{
            mt: 2,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", xl: "1.45fr 0.7fr" },
            gap: 1.5,
          }}
        >
          <Stack spacing={1.5}>
            <Card sx={panelCardSx}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.25 }}>
                <InfoOutlined sx={{ fontSize: 17, color: "#8F98A3" }} />
                <Typography sx={panelTitleSx}>General Information</Typography>
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 1.75,
                }}
              >
                <Box>
                  <Typography sx={fieldLabelSx}>Service Category</Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={form.category}
                    onChange={handleChange("category")}
                    sx={inputSx}
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Box>
                  <Typography sx={fieldLabelSx}>Service Type Name</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={form.name}
                    onChange={handleChange("name")}
                    placeholder="e.g. Annual HVAC Inspection"
                    sx={inputSx}
                  />
                </Box>

                <Box sx={{ gridColumn: "1 / -1" }}>
                  <Typography sx={fieldLabelSx}>Default Price</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={form.basePrice}
                    onChange={handleChange("basePrice")}
                    sx={inputSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Typography sx={{ fontSize: 12, color: "#AAA39C" }}>
                            $
                          </Typography>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Typography sx={{ mt: 0.75, fontSize: 10.5, color: "#B1AAA3" }}>
                    Base rate charged for this service before add-ons.
                  </Typography>
                </Box>
              </Box>
            </Card>

            <Card sx={panelCardSx}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2.1 }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <PhotoCameraOutlined sx={{ fontSize: 17, color: "#8F98A3" }} />
                  <Typography sx={panelTitleSx}>Photo Checklist</Typography>
                </Stack>

                <Button
                  startIcon={<AddOutlined sx={{ fontSize: 14 }} />}
                  onClick={handleAddRequirement}
                  sx={{
                    minHeight: 28,
                    px: 1.1,
                    textTransform: "none",
                    color: "#8D7B72",
                    fontSize: 11.25,
                    fontWeight: 600,
                  }}
                >
                  Add Requirement
                </Button>
              </Stack>

              <Stack spacing={1}>
                {form.photoChecklist.length ? (
                  form.photoChecklist.map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        p: 1.35,
                        borderRadius: 1,
                        bgcolor: "#FBFDFF",
                        border: "1px solid #E7EDF3",
                      }}
                    >
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <DragIndicatorOutlined
                          sx={{ color: "#B5C0CC", fontSize: 17, cursor: "grab" }}
                        />
                        <TextField
                          variant="standard"
                          fullWidth
                          value={item.title}
                          onChange={(event) =>
                            handleRequirementChange(item.id, "title", event.target.value)
                          }
                          InputProps={{
                            disableUnderline: true,
                            sx: {
                              fontSize: 12.75,
                              fontWeight: 600,
                              color: "#1F2937",
                            },
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveRequirement(item.id)}
                          sx={{ color: "#C4B7AE" }}
                        >
                          <DeleteOutlineOutlined sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Stack>

                      <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mt: 0.6, ml: 3.9 }}>
                        <Checkbox
                          size="small"
                          checked={item.required}
                          onChange={(event) =>
                            handleRequirementChange(
                              item.id,
                              "required",
                              event.target.checked,
                            )
                          }
                          sx={checkboxSx}
                        />
                        <Typography
                          sx={{
                            fontSize: 10.5,
                            color: "#A39D96",
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                          }}
                        >
                          {item.required ? "Required" : "Optional"} •{" "}
                          {formatCaptureTypeLabel(item.captureType)}
                        </Typography>
                      </Stack>
                    </Box>
                  ))
                ) : (
                  <Box
                    sx={{
                      minHeight: 112,
                      borderRadius: 1,
                      border: "1px dashed #E6DED7",
                      bgcolor: "#FCFAF8",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Typography sx={{ fontSize: 12.5, color: "#A39D96", fontWeight: 500 }}>
                      No checklist requirements yet
                    </Typography>
                  </Box>
                )}
              </Stack>

              <Box
                sx={{
                  mt: 1.2,
                  p: 1.35,
                  borderRadius: 1,
                  bgcolor: "#FCFAF8",
                  border: "1px dashed #E5DED7",
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 180px auto" },
                  gap: 1.1,
                  alignItems: "end",
                }}
              >
                <Box>
                  <Typography sx={fieldLabelSx}>Requirement Title</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={newRequirement.title}
                    onChange={(event) =>
                      setNewRequirement((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                    placeholder="e.g. Before Service Overview"
                    sx={inputSx}
                  />
                </Box>

                <Box>
                  <Typography sx={fieldLabelSx}>Capture Type</Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={newRequirement.captureType}
                    onChange={(event) =>
                      setNewRequirement((prev) => ({
                        ...prev,
                        captureType: event.target.value,
                      }))
                    }
                    sx={inputSx}
                  >
                    {CAPTURE_TYPE_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newRequirement.required}
                      onChange={(event) =>
                        setNewRequirement((prev) => ({
                          ...prev,
                          required: event.target.checked,
                        }))
                      }
                      sx={checkboxSx}
                    />
                  }
                  label="Required"
                  sx={checkboxLabelRowSx}
                />
              </Box>
            </Card>
          </Stack>

          <Stack spacing={1.5}>
            <Card sx={panelCardSx}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.1 }}>
                <AccountTreeOutlined sx={{ fontSize: 17, color: "#8F98A3" }} />
                <Typography sx={panelTitleSx}>Workflow Rules</Typography>
              </Stack>

              <Typography sx={fieldLabelSx}>Service Logic</Typography>
              <TextField
                multiline
                rows={4}
                fullWidth
                value={form.workflowLogic}
                onChange={handleChange("workflowLogic")}
                placeholder="IF service_duration > 2h THEN apply_buffer_30m..."
                sx={workflowInputSx}
              />

              <Stack spacing={0.5} sx={{ mt: 1.6 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.requireSignature}
                      onChange={handleChange("requireSignature")}
                      sx={checkboxSx}
                    />
                  }
                  label="Require signature on completion"
                  sx={checkboxLabelRowSx}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.autoApproveInvoices}
                      onChange={handleChange("autoApproveInvoices")}
                      sx={checkboxSx}
                    />
                  }
                  label="Auto-approve invoices < $500"
                  sx={checkboxLabelRowSx}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.notifyClientOnDispatch}
                      onChange={handleChange("notifyClientOnDispatch")}
                      sx={checkboxSx}
                    />
                  }
                  label="Notify client on dispatch"
                  sx={checkboxLabelRowSx}
                />
              </Stack>
            </Card>

            <Card
              sx={{
                p: 1.8,
                borderRadius: 1.2,
                border: "1px solid #DCCFC4",
                boxShadow: "none",
                bgcolor: "#F7F3EF",
              }}
            >
              <Typography sx={summaryHeadingSx}>Configuration Summary</Typography>

              <Stack spacing={1.05} sx={{ mt: 1.4 }}>
                <SummaryRow label="Service Category" value={summary.category} />
                <SummaryRow
                  label="Photos Required"
                  value={`${summary.photosRequired} Items`}
                />
                <SummaryRow
                  label="Processing Mode"
                  value={
                    <Box sx={summaryModePillSx}>{summary.processingMode}</Box>
                  }
                />
              </Stack>

              <Box
                sx={{
                  mt: 2,
                  p: 1.1,
                  borderRadius: 1,
                  bgcolor: "#FFFFFF",
                  border: "1px solid #E4D9CF",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 1,
                      bgcolor: "#F5EFEA",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <HelpOutlineOutlined sx={{ fontSize: 16, color: "#9B8E84" }} />
                  </Box>

                  <Box>
                    <Typography
                      sx={{ fontSize: 11.25, fontWeight: 700, color: "#4B5563" }}
                    >
                      Need help?
                    </Typography>
                    <Typography
                      sx={{ mt: 0.2, fontSize: 10.5, color: "#9CA3AF", lineHeight: 1.45 }}
                    >
                      Use documentation on how to write complex workflow rules.
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Card>
          </Stack>
        </Box>
      </Box>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
      >
        <Alert
          icon={<CheckCircleOutline fontSize="inherit" />}
          severity="success"
          sx={{
            width: "100%",
            bgcolor: "#10B981",
            color: "#FFF",
            "& .MuiAlert-icon": { color: "#FFF" },
          }}
        >
          Configuration saved successfully
        </Alert>
      </Snackbar>
    </Box>
  );
}

function SummaryRow({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography sx={{ fontSize: 11.5, color: "#8C8C8C", fontWeight: 500 }}>
        {label}
      </Typography>
      {typeof value === "string" || typeof value === "number" ? (
        <Typography
          sx={{
            fontSize: 11.5,
            color: "#1F2937",
            fontWeight: 600,
            textAlign: "right",
          }}
        >
          {value}
        </Typography>
      ) : (
        value
      )}
    </Stack>
  );
}

const panelCardSx = {
  p: 2,
  borderRadius: 1.2,
  border: "1px solid #E9E1DB",
  boxShadow: "none",
  bgcolor: "#FFFFFF",
};

const panelTitleSx = {
  fontSize: 15,
  fontWeight: 700,
  color: "#1F2937",
};

const fieldLabelSx = {
  mb: 0.55,
  fontSize: 11.25,
  fontWeight: 700,
  color: "#4B5563",
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 1,
    bgcolor: "#F8FBFF",
    minHeight: 36,
    fontSize: 12,
    color: "#374151",
    "& fieldset": { borderColor: "#E3E9EF" },
    "&:hover fieldset": { borderColor: "#D7DEE7" },
    "&.Mui-focused fieldset": {
      borderColor: "#C7D3E0",
      borderWidth: "1px",
    },
  },
  "& .MuiInputBase-input": { fontSize: 12, py: 1 },
};

const workflowInputSx = {
  ...inputSx,
  "& .MuiInputBase-root": {
    borderRadius: 1,
    bgcolor: "#F8FBFF",
    fontFamily: "monospace",
    fontSize: 11.25,
    color: "#374151",
  },
};

const checkboxSx = {
  p: 0.45,
  color: "#9C8D81",
};

const checkboxLabelRowSx = {
  m: 0,
  "& .MuiFormControlLabel-label": {
    fontSize: 11.5,
    fontWeight: 500,
    color: "#374151",
  },
};

const cancelButtonSx = {
  height: 34,
  px: 2,
  textTransform: "none",
  fontWeight: 600,
  fontSize: 11.5,
  color: "#4B5563",
  borderColor: "#E7DFD8",
  bgcolor: "#FFF",
  borderRadius: 1,
  boxShadow: "none",
  "&:hover": {
    borderColor: "#DED3CB",
    bgcolor: "#FCFAF8",
    boxShadow: "none",
  },
};

const saveButtonSx = {
  height: 34,
  px: 2,
  textTransform: "none",
  fontWeight: 600,
  fontSize: 11.5,
  bgcolor: "#8E8175",
  borderRadius: 1,
  boxShadow: "none",
  "&:hover": { bgcolor: "#7F7267", boxShadow: "none" },
  "&.Mui-disabled": { bgcolor: "#D7CDC6", color: "#8F8A84" },
};

const summaryHeadingSx = {
  fontSize: 10,
  fontWeight: 800,
  color: "#9C928A",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};

const summaryModePillSx = {
  px: 1,
  py: 0.3,
  borderRadius: 1,
  bgcolor: "#E7DED6",
  color: "#8A7D73",
  fontSize: 10,
  fontWeight: 700,
};
