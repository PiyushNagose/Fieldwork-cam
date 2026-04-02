import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useParams } from "react-router-dom";
import {
  getSubmissionByIdApi,
  reviewSubmissionApi,
  requestRetakeSubmissionApi,
} from "../../api/submission.api";

export default function SubmissionReviewPage() {
  const { submissionId } = useParams();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [comment, setComment] = useState("");

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getSubmissionByIdApi(submissionId);
      const data = res?.data || res;

      setSubmission(data);
      setComment(data?.adminComments || "");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load submission",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmission();
  }, [submissionId]);

  const reviewAction = async (type) => {
    try {
      setActing(true);
      setError("");
      setSuccessMessage("");

      if (type === "approve") {
        await reviewSubmissionApi(submissionId, {
          decision: "Approved",
          adminComments: comment,
        });
        setSuccessMessage("Submission approved successfully.");
      }

      if (type === "reject") {
        await reviewSubmissionApi(submissionId, {
          decision: "Rejected",
          adminComments: comment,
        });
        setSuccessMessage("Submission rejected successfully.");
      }

      if (type === "retake") {
        await requestRetakeSubmissionApi(submissionId, {
          adminComments: comment,
        });
        setSuccessMessage("Retake requested successfully.");
      }

      await fetchSubmission();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update submission",
      );
    } finally {
      setActing(false);
    }
  };

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

  return (
    <Box>
      <Typography sx={{ fontSize: 30, fontWeight: 900 }}>
        Submission Review
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Card sx={{ mt: 2, p: 3 }}>
        <Typography fontWeight={700}>Project ID</Typography>
        <Typography>{submission?.projectId}</Typography>

        <Typography mt={2} fontWeight={700}>
          Status
        </Typography>
        <Typography>{submission?.status}</Typography>

        <Typography mt={2} fontWeight={700}>
          AI Score
        </Typography>
        <Typography>{submission?.aiAverageScore || 0}</Typography>
      </Card>

      {/* COMMENT */}
      <Card sx={{ mt: 2, p: 3 }}>
        <Typography fontWeight={700}>Admin Comments</Typography>

        <TextField
          fullWidth
          multiline
          minRows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write your review comments..."
          sx={{ mt: 1 }}
        />
      </Card>

      {/* ACTION BUTTONS */}
      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <Button
          variant="contained"
          color="success"
          disabled={acting}
          onClick={() => reviewAction("approve")}
        >
          Approve
        </Button>

        <Button
          variant="contained"
          color="error"
          disabled={acting}
          onClick={() => reviewAction("reject")}
        >
          Reject
        </Button>

        <Button
          variant="outlined"
          disabled={acting}
          onClick={() => reviewAction("retake")}
        >
          Request Retake
        </Button>
      </Stack>
    </Box>
  );
}
