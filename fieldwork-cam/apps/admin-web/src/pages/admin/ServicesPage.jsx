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
  MenuItem,
  Stack,
  TextField,
  Typography,
  Snackbar,
  InputAdornment,
} from "@mui/material";
import {
  InfoOutlined,
  PhotoCameraOutlined,
  AddOutlined,
  DeleteOutlineOutlined,
  HelpOutlineOutlined,
  DragIndicatorOutlined,
  AccountTreeOutlined,
  CheckCircleOutline,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  createServiceApi,
  getServicesApi,
  updateServiceApi,
} from "../../api/service.api";

// --- Constants ---
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

// --- Styled Components / SX ---
const fieldLabelSx = {
  mb: 0.55,
  fontSize: 11,
  fontWeight: 700,
  color: "#374151",
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
    "&.Mui-focused fieldset": { borderColor: "#C7D3E0", borderWidth: "1px" },
  },
  "& .MuiInputBase-input": { fontSize: 12, py: 1 },
};

const checkboxSx = { p: 0.45, color: "#9C8D81" };

const checkboxLabelRowSx = {
  m: 0,
  "& .MuiFormControlLabel-label": {
    fontSize: 11.5,
    fontWeight: 500,
    color: "#374151",
  },
};

// --- Sub-components ---
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

// --- Main Component ---
export default function ServicesPage() {
  const navigate = useNavigate();

  // State
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

  // Fetch Logic
  const fetchService = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getServicesApi();
      const data = res?.data || res || [];
      const s = Array.isArray(data) && data.length ? data[0] : null;

      if (!s) {
        setServiceId("");
        return;
      }

      setServiceId(s._id || s.id || "");
      setForm({
        category: s.category || "",
        name: s.name || "",
        basePrice: s.defaultPrice ?? "",
        workflowLogic: s.workflowRules?.serviceLogic || "",
        requireSignature: !!s.workflowRules?.requireSignatureOnCompletion,
        autoApproveInvoices: !!s.workflowRules?.autoApproveInvoicesUnder500,
        notifyClientOnDispatch: !!s.workflowRules?.notifyClientOnDispatch,
        photoChecklist: (s.photoChecklist || []).map((item) => ({
          ...item,
          id: item.id || Math.random().toString(36).substr(2, 9), // Ensure unique IDs for keys
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

  // Handlers
  const handleChange = (key) => (event) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddRequirement = () => {
    if (!newRequirement.title.trim()) return;
    setForm((prev) => ({
      ...prev,
      photoChecklist: [
        ...prev.photoChecklist,
        { ...newRequirement, id: Math.random().toString(36).substr(2, 9) },
      ],
    }));
    setNewRequirement({ title: "", required: true, captureType: "STANDARD" });
  };

  const handleRemoveRequirement = (id) => {
    setForm((prev) => ({
      ...prev,
      photoChecklist: prev.photoChecklist.filter((item) => item.id !== id),
    }));
  };

  const handleRequirementChange = (id, key, value) => {
    setForm((prev) => ({
      ...prev,
      photoChecklist: prev.photoChecklist.map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
    }));
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
        photoChecklist: form.photoChecklist,
      };

      if (serviceId) {
        await updateServiceApi(serviceId, payload);
      } else {
        const res = await createServiceApi(payload);
        setServiceId(res?.data?._id || res?._id || "");
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
      category: form.category || "—",
      photosRequired: form.photoChecklist.filter((i) => i.required).length,
      processingMode: form.autoApproveInvoices ? "AUTOMATED" : "MANUAL",
    }),
    [form],
  );

  if (loading)
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: 400 }}
        spacing={2}
      >
        <CircularProgress sx={{ color: "#8E8175" }} />
        <Typography color="text.secondary" variant="body2">
          Syncing configuration...
        </Typography>
      </Stack>
    );

  return (
    <Box
      sx={{
        px: { xs: 2, md: 4 },
        py: 3,
        bgcolor: "#F8F5F2",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems="flex-start"
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: 28,
              fontWeight: 700,
              color: "#1F2937",
              letterSpacing: "-0.02em",
            }}
          >
            Service Configuration
          </Typography>
          <Typography sx={{ color: "#9CA3AF", fontSize: 14, fontWeight: 500 }}>
            Configure operational workflows and documentation requirements.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
            sx={{
              height: 36,
              px: 3,
              textTransform: "none",
              fontWeight: 600,
              color: "#4B5563",
              borderColor: "#E7DFD8",
              bgcolor: "#FFF",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{
              height: 36,
              px: 3,
              textTransform: "none",
              fontWeight: 600,
              bgcolor: "#8E8175",
              "&:hover": { bgcolor: "#7F7267" },
            }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1.4fr 0.6fr" },
          gap: 3,
        }}
      >
        {/* Left Column */}
        <Stack spacing={3}>
          {/* General Info */}
          <Card
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid #E9E1DB",
              boxShadow: "none",
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 3 }}
            >
              <InfoOutlined sx={{ fontSize: 18, color: "#8F98A3" }} />
              <Typography sx={{ fontSize: 15, fontWeight: 700 }}>
                General Details
              </Typography>
            </Stack>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2.5,
              }}
            >
              <Box>
                <Typography sx={fieldLabelSx}>Category</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={form.category}
                  onChange={handleChange("category")}
                  sx={inputSx}
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box>
                <Typography sx={fieldLabelSx}>Service Name</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={form.name}
                  onChange={handleChange("name")}
                  placeholder="e.g. Roof Inspection"
                  sx={inputSx}
                />
              </Box>
              <Box sx={{ gridColumn: "1 / -1" }}>
                <Typography sx={fieldLabelSx}>Base Rate</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={form.basePrice}
                  onChange={handleChange("basePrice")}
                  sx={inputSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography sx={{ fontSize: 12 }}>$</Typography>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>
          </Card>

          {/* Photo Checklist */}
          <Card
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid #E9E1DB",
              boxShadow: "none",
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{ mb: 3 }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <PhotoCameraOutlined sx={{ fontSize: 18, color: "#8F98A3" }} />
                <Typography sx={{ fontSize: 15, fontWeight: 700 }}>
                  Evidence Checklist
                </Typography>
              </Stack>
            </Stack>

            <Stack spacing={1.5} sx={{ mb: 3 }}>
              {form.photoChecklist.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    p: 2,
                    borderRadius: 1.5,
                    bgcolor: "#F8FBFF",
                    border: "1px solid #E7EAF0",
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <DragIndicatorOutlined
                      sx={{ color: "#B5C0CC", cursor: "grab" }}
                    />
                    <TextField
                      variant="standard"
                      fullWidth
                      value={item.title}
                      onChange={(e) =>
                        handleRequirementChange(
                          item.id,
                          "title",
                          e.target.value,
                        )
                      }
                      InputProps={{
                        disableUnderline: true,
                        sx: { fontSize: 13, fontWeight: 600 },
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveRequirement(item.id)}
                      sx={{ color: "#FDA29B" }}
                    >
                      <DeleteOutlineOutlined fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Stack direction="row" spacing={3} sx={{ mt: 1, ml: 4.5 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={item.required}
                          onChange={(e) =>
                            handleRequirementChange(
                              item.id,
                              "required",
                              e.target.checked,
                            )
                          }
                          sx={checkboxSx}
                        />
                      }
                      label="Required"
                      sx={checkboxLabelRowSx}
                    />
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: "#9CA3AF",
                        alignSelf: "center",
                      }}
                    >
                      Type: {item.captureType.replace("_", " ")}
                    </Typography>
                  </Stack>
                </Box>
              ))}
            </Stack>

            <Box
              sx={{
                p: 2,
                bgcolor: "#FCFAF8",
                borderRadius: 2,
                border: "1px dashed #E5DED7",
                display: "grid",
                gridTemplateColumns: "1fr 1fr auto",
                gap: 2,
                alignItems: "end",
              }}
            >
              <Box>
                <Typography sx={fieldLabelSx}>New Requirement</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={newRequirement.title}
                  onChange={(e) =>
                    setNewRequirement((p) => ({ ...p, title: e.target.value }))
                  }
                  sx={inputSx}
                  placeholder="e.g. Before Photo"
                />
              </Box>
              <Box>
                <Typography sx={fieldLabelSx}>Capture Type</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={newRequirement.captureType}
                  onChange={(e) =>
                    setNewRequirement((p) => ({
                      ...p,
                      captureType: e.target.value,
                    }))
                  }
                  sx={inputSx}
                >
                  {CAPTURE_TYPE_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Button
                onClick={handleAddRequirement}
                variant="contained"
                sx={{ height: 36, bgcolor: "#8E8175", minWidth: 80 }}
              >
                Add
              </Button>
            </Box>
          </Card>
        </Stack>

        {/* Right Column */}
        <Stack spacing={3}>
          <Card
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid #E9E1DB",
              boxShadow: "none",
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <AccountTreeOutlined sx={{ fontSize: 18, color: "#8F98A3" }} />
              <Typography sx={{ fontSize: 15, fontWeight: 700 }}>
                Automation Rules
              </Typography>
            </Stack>
            <Typography sx={fieldLabelSx}>Workflow Logic</Typography>
            <TextField
              multiline
              rows={4}
              fullWidth
              value={form.workflowLogic}
              onChange={handleChange("workflowLogic")}
              placeholder="IF service_type == 'emergency' THEN apply_premium_markup..."
              sx={{
                ...inputSx,
                "& .MuiInputBase-root": {
                  fontFamily: "monospace",
                  fontSize: 11,
                },
              }}
            />
            <Stack spacing={1} sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.requireSignature}
                    onChange={handleChange("requireSignature")}
                    sx={checkboxSx}
                  />
                }
                label="Require completion signature"
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
                label="Auto-approve small invoices"
                sx={checkboxLabelRowSx}
              />
            </Stack>
          </Card>

          <Card
            sx={{
              p: 3,
              bgcolor: "#F7F3EF",
              border: "1px solid #DCCFC4",
              boxShadow: "none",
              borderRadius: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 800,
                color: "#9C928A",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                mb: 2,
              }}
            >
              Live Summary
            </Typography>
            <Stack spacing={1.5}>
              <SummaryRow
                label="Total Requirements"
                value={form.photoChecklist.length}
              />
              <SummaryRow
                label="Mandatory Actions"
                value={summary.photosRequired}
              />
              <SummaryRow
                label="Mode"
                value={
                  <Box
                    sx={{
                      px: 1,
                      py: 0.3,
                      borderRadius: 1,
                      bgcolor: "#E7DED6",
                      color: "#8A7D73",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {summary.processingMode}
                  </Box>
                }
              />
            </Stack>
          </Card>
        </Stack>
      </Box>

      {/* Success Feedback */}
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
