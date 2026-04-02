import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Stack,
  OutlinedInput,
  InputAdornment,
  Checkbox,
  Chip,
  Button,
} from "@mui/material";
import { SearchOutlined } from "@mui/icons-material";

import { getProjectsApi } from "../../api/project.api";
import { assignProjectToStaffApi } from "../../api/staff.api";

export default function AssignProjectModal({
  open,
  onClose,
  staff,
  onSuccess,
}) {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");

  const fetchProjects = async () => {
    const res = await getProjectsApi();
    setProjects(res?.data || []);
  };

  useEffect(() => {
    if (open) fetchProjects();
  }, [open]);

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleAssign = async () => {
    for (const projectId of selected) {
      await assignProjectToStaffApi(staff.authUserId, projectId);
    }
    onSuccess?.();
    onClose();
  };

  const filtered = projects.filter((p) =>
    (p.title || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent sx={{ p: 0 }}>
        {/* HEADER */}
        <Box sx={{ p: 2, borderBottom: "1px solid #E5DED7" }}>
          <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
            Assign Projects to {staff?.fullName}
          </Typography>

          <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>
            {staff?.roleTitle} • Currently assigned{" "}
            {staff?.assignedProjectIds?.length || 0} projects
          </Typography>
        </Box>

        {/* SEARCH */}
        <Box sx={{ p: 2 }}>
          <OutlinedInput
            fullWidth
            size="small"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <SearchOutlined />
              </InputAdornment>
            }
          />

          {/* COUNT */}
          <Typography
            sx={{ mt: 1, fontSize: 12, textAlign: "right", color: "#6B7280" }}
          >
            {selected.length} selected
          </Typography>
        </Box>

        {/* LIST */}
        <Box sx={{ maxHeight: 400, overflowY: "auto", px: 2 }}>
          <Stack spacing={1}>
            {filtered.map((p) => (
              <Box
                key={p._id}
                onClick={() => toggleSelect(p._id)}
                sx={{
                  p: 1.5,
                  border: "1px solid #E5DED7",
                  borderRadius: 2,
                  cursor: "pointer",
                }}
              >
                <Stack direction="row" justifyContent="space-between">
                  <Stack direction="row" spacing={1}>
                    <Checkbox checked={selected.includes(p._id)} />

                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                        {p.title}
                      </Typography>

                      <Typography sx={{ fontSize: 12, color: "#6B7280" }}>
                        {p.code} • {p.type}
                      </Typography>

                      <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>
                        {p.location} • {formatDate(p.date)}
                      </Typography>
                    </Box>
                  </Stack>

                  <Chip
                    label={p.priority || "Medium"}
                    size="small"
                    sx={{
                      fontSize: 11,
                      bgcolor: getPriorityBg(p.priority),
                    }}
                  />
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* FOOTER */}
        <Stack direction="row" spacing={1} sx={{ p: 2 }}>
          <Button fullWidth variant="outlined" onClick={onClose}>
            Cancel
          </Button>

          <Button
            fullWidth
            variant="contained"
            onClick={handleAssign}
            sx={{
              bgcolor: "#CBB8AD",
              color: "#000",
            }}
          >
            Assign {selected.length} Projects
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

/* HELPERS */

function getPriorityBg(p) {
  if (p === "High") return "#FEE2E2";
  if (p === "Medium") return "#FEF3C7";
  return "#E5E7EB";
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}
