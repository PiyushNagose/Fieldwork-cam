import React, { useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  MenuItem,
  OutlinedInput,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  CalendarTodayOutlined,
  CloseOutlined,
  PersonAddAlt1Outlined,
  SearchOutlined,
} from "@mui/icons-material";
import {
  assignStaffToProjectApi,
  removeStaffFromProjectApi,
} from "../../api/project.api";
import {
  assignProjectToStaffApi,
  removeProjectFromStaffApi,
} from "../../api/staff.api";

const STATUS_OPTIONS = ["ALL", "ACTIVE", "ON_LEAVE", "INACTIVE"];

export default function VendorAssignStaffDialog({
  open,
  onClose,
  project,
  staff,
  onSuccess,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const assignedIds = useMemo(
    () => new Set((project?.assignedStaff || []).map((item) => String(item.staffId))),
    [project],
  );

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();

    return (Array.isArray(staff) ? staff : []).filter((item) => {
      const matchesStatus =
        statusFilter === "ALL" ? true : item.status === statusFilter;
      const matchesSearch = query
        ? [
            item.fullName,
            item.roleTitle,
            item.location,
            item.email,
            item.authUserId,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query)
        : true;

      return matchesStatus && matchesSearch;
    });
  }, [search, staff, statusFilter]);

  const handleToggleAssignment = async (staffMember) => {
    if (!project?._id || !staffMember?.authUserId) return;

    const alreadyAssigned = assignedIds.has(String(staffMember.authUserId));

    try {
      setSubmitting(true);
      setError("");

      if (alreadyAssigned) {
        await Promise.all([
          removeStaffFromProjectApi(project._id, staffMember.authUserId),
          removeProjectFromStaffApi(staffMember.authUserId, project._id),
        ]);

        onSuccess?.(
          `${staffMember?.fullName || "Staff member"} removed from ${project?.title || project?.address || "project"}.`,
        );
      } else {
        await Promise.all([
          assignStaffToProjectApi(project._id, staffMember.authUserId),
          assignProjectToStaffApi(staffMember.authUserId, project._id),
        ]);

        onSuccess?.(
          `${staffMember?.fullName || "Staff member"} assigned to ${project?.title || project?.address || "project"}.`,
        );
      }

      onClose?.();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          `Failed to ${alreadyAssigned ? "remove" : "assign"} staff`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 1,
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          px: 2.4,
          py: 2,
          bgcolor: "#E7D3C8",
          borderBottom: "1px solid #E5DED7",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              src={project?.coverImageUrl || ""}
              sx={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                bgcolor: "#F4E5DC",
                color: "#6F554B",
              }}
            >
              <PersonAddAlt1Outlined sx={{ fontSize: 20 }} />
            </Avatar>

            <Box>
              <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#1F2937" }}>
                Assign Staff to {project?.title || project?.address || "Project"}
              </Typography>
              <Typography
                sx={{ mt: 0.35, fontSize: 12.5, color: "#5F6368", fontWeight: 500 }}
              >
                {project?.serviceType || "Field Project"} • {assignedIds.size} currently
                assigned
              </Typography>
            </Box>
          </Stack>

          <IconButton onClick={onClose} size="small" sx={{ color: "#374151" }}>
            <CloseOutlined sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </Box>

      <DialogContent sx={{ px: 0, py: 0 }}>
        <Box sx={{ p: 2 }}>
          <OutlinedInput
            fullWidth
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search staff by name, role, location, or email..."
            startAdornment={
              <InputAdornment position="start">
                <SearchOutlined sx={{ fontSize: 18, color: "#9CA3AF" }} />
              </InputAdornment>
            }
            sx={{
              height: 40,
              bgcolor: "#FFFFFF",
              borderRadius: 1,
              fontSize: 13,
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E9E1DB" },
            }}
          />

          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
            spacing={1.2}
            sx={{ mt: 1.5 }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#6B7280" }}>
                Filters:
              </Typography>
              <TextField
                select
                size="small"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                sx={{
                  minWidth: 140,
                  "& .MuiOutlinedInput-root": {
                    height: 32,
                    borderRadius: 1,
                    fontSize: 12.5,
                    bgcolor: "#FFFFFF",
                  },
                }}
              >
                {STATUS_OPTIONS.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item === "ALL" ? "All Statuses" : formatStatus(item)}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Typography sx={{ fontSize: 12.5, color: "#6B7280", fontWeight: 600 }}>
              {assignedIds.size} assigned • {filteredStaff.length} available
            </Typography>
          </Stack>

          {error ? (
            <Alert severity="error" sx={{ mt: 1.5, borderRadius: 1 }}>
              {error}
            </Alert>
          ) : null}
        </Box>

        <Box
          sx={{
            maxHeight: 420,
            overflowY: "auto",
            px: 2,
            pb: 2,
          }}
        >
          <Stack spacing={1.5}>
            {filteredStaff.length ? (
              filteredStaff.map((item) => {
                const alreadyAssigned = assignedIds.has(String(item.authUserId));

                return (
                  <Box
                    key={item.authUserId}
                    sx={{
                      border: "1px solid #D9CEC6",
                      borderRadius: 1,
                      px: 1.6,
                      py: 1.5,
                      bgcolor: "#FFFFFF",
                      boxShadow: "0 1px 2px rgba(18, 24, 40, 0.04)",
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      spacing={1.5}
                    >
                      <Stack direction="row" spacing={1.2}>
                        <Avatar
                          src={item.profilePhotoUrl || ""}
                          sx={{
                            width: 42,
                            height: 42,
                            borderRadius: 1,
                            bgcolor: "#E9CFC2",
                            color: "#7C6258",
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          {item.fullName?.charAt(0) || "S"}
                        </Avatar>

                        <Box>
                          <Typography
                            sx={{ fontSize: 13.5, fontWeight: 700, color: "#1F2937" }}
                          >
                            {item.fullName || "Unnamed Staff"}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.2,
                              fontSize: 12,
                              color: "#6B7280",
                              fontWeight: 500,
                            }}
                          >
                            {item.roleTitle || "Field Photographer"}
                          </Typography>

                          <Stack
                            direction="row"
                            spacing={1.2}
                            alignItems="center"
                            sx={{ mt: 0.9, flexWrap: "wrap" }}
                          >
                            <Typography
                              sx={{
                                fontSize: 12,
                                color: "#4F46E5",
                                fontWeight: 700,
                              }}
                            >
                              {item.authUserId}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: 12,
                                color: "#6B7280",
                                fontWeight: 500,
                              }}
                            >
                              {item.location || "No location"}
                            </Typography>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <CalendarTodayOutlined
                                sx={{ fontSize: 13, color: "#9CA3AF" }}
                              />
                              <Typography
                                sx={{
                                  fontSize: 12,
                                  color: "#6B7280",
                                  fontWeight: 500,
                                }}
                              >
                                {item.activeAssignments || 0} active assignments
                              </Typography>
                            </Stack>
                          </Stack>
                        </Box>
                      </Stack>

                      <Button
                        variant="outlined"
                        disabled={submitting}
                        onClick={() => handleToggleAssignment(item)}
                        sx={{
                          minWidth: 92,
                          minHeight: 32,
                          borderRadius: 1,
                          borderColor: alreadyAssigned ? "#E9BDBD" : "#E9CFC2",
                          bgcolor: alreadyAssigned ? "#FFF7F7" : "#FFFFFF",
                          color: alreadyAssigned ? "#B45353" : "#7C6258",
                          fontSize: 12,
                          fontWeight: 700,
                          textTransform: "none",
                          "&:hover": {
                            borderColor: alreadyAssigned ? "#DB9D9D" : "#DFC1B3",
                            bgcolor: alreadyAssigned ? "#FFF1F1" : "#FCFAF8",
                          },
                        }}
                      >
                        {alreadyAssigned ? "Remove" : "Assign"}
                      </Button>
                    </Stack>
                  </Box>
                );
              })
            ) : (
              <Box
                sx={{
                  minHeight: 180,
                  borderRadius: 1,
                  border: "1px dashed #E5DED7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#B0B5BE",
                  fontSize: 13,
                  bgcolor: "#FCFAF8",
                }}
              >
                No staff members found
              </Box>
            )}
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function formatStatus(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
