import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  Stack,
  Typography,
  CircularProgress,
  Chip,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { getProjectByIdApi } from "../../api/project.api";

export default function VendorProjectDetailsPage() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getProjectByIdApi(id);
        setProject(res?.data || res || {});
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: 300 }}
      >
        <CircularProgress />
      </Stack>
    );
  }

  if (!project) return <Empty />;

  return (
    <Box>
      {/* HERO */}
      <Card sx={{ border: "1px solid #E9E1DB", overflow: "hidden" }}>
        <Box sx={{ height: 220, bgcolor: "#E5E7EB", position: "relative" }}>
          <Box sx={{ position: "absolute", bottom: 12, left: 16 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
              {project.title}
            </Typography>
          </Box>
        </Box>

        {/* META */}
        <Box sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Meta label="Start Date" value={project.startDate} />
            <Meta label="Due Date" value={project.dueDate} />
            <Meta label="Status" value={project.status} />
            <Meta label="Budget" value={project.budget} />
          </Stack>
        </Box>
      </Card>

      {/* LOCATION */}
      <Card sx={{ mt: 1.5, p: 2, border: "1px solid #E9E1DB" }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700 }}>Location</Typography>

        <Box
          sx={{
            mt: 1.5,
            height: 120,
            border: "1px dashed #E5DED7",
            borderRadius: 1,
          }}
        />
      </Card>

      {/* CHECKLIST */}
      <Card sx={{ mt: 1.5, p: 2, border: "1px solid #E9E1DB" }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
          Photo Checklist
        </Typography>

        <Stack spacing={1.2} sx={{ mt: 1.5 }}>
          {(project.checklist || []).length ? (
            project.checklist.map((item, i) => (
              <Stack key={i} direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: 13 }}>{item.name}</Typography>

                <Chip
                  label={item.status || "Pending"}
                  size="small"
                  sx={{ fontSize: 11 }}
                />
              </Stack>
            ))
          ) : (
            <EmptySmall />
          )}
        </Stack>
      </Card>

      {/* QUICK STATS */}
      <Card sx={{ mt: 1.5, p: 2, border: "1px solid #E9E1DB" }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
          Quick Stats
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mt: 1.5 }}>
          <Stat label="Photos" value={project.photos || 0} />
          <Stat label="Progress" value={`${project.progress || 0}%`} />
        </Stack>
      </Card>

      {/* ASSIGNED STAFF */}
      <Card sx={{ mt: 1.5, p: 2, border: "1px solid #E9E1DB" }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
          Assigned Staff
        </Typography>

        <Typography sx={{ mt: 1, fontSize: 13 }}>
          {project.staff?.name || "No staff assigned"}
        </Typography>
      </Card>

      {/* TIMELINE */}
      <Card sx={{ mt: 1.5, p: 2, border: "1px solid #E9E1DB" }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700 }}>Timeline</Typography>

        <Stack spacing={1.2} sx={{ mt: 1.5 }}>
          {(project.timeline || []).length ? (
            project.timeline.map((t, i) => (
              <Typography key={i} sx={{ fontSize: 12 }}>
                {t}
              </Typography>
            ))
          ) : (
            <EmptySmall />
          )}
        </Stack>
      </Card>

      {/* NOTES */}
      <Card sx={{ mt: 1.5, p: 2, border: "1px solid #E9E1DB" }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
          Recent Notes
        </Typography>

        <Stack spacing={1} sx={{ mt: 1.5 }}>
          {(project.notes || []).length ? (
            project.notes.map((n, i) => (
              <Typography key={i} sx={{ fontSize: 12 }}>
                {n}
              </Typography>
            ))
          ) : (
            <EmptySmall />
          )}
        </Stack>
      </Card>
    </Box>
  );
}

/* COMPONENTS */

function Meta({ label, value }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>{label}</Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
        {value || "—"}
      </Typography>
    </Box>
  );
}

function Stat({ label, value }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>{label}</Typography>
      <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{value}</Typography>
    </Box>
  );
}

function Empty() {
  return <Box sx={{ textAlign: "center", mt: 4 }}>No project found</Box>;
}

function EmptySmall() {
  return (
    <Typography sx={{ fontSize: 12, color: "#B0B5BE" }}>
      No data available
    </Typography>
  );
}
