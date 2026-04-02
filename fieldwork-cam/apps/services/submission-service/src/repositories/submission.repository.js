const Submission = require("../models/Submission.model");

const createSubmission = (payload) => Submission.create(payload);

const findSubmissionById = (id) => Submission.findById(id);

const findSubmissionByProjectId = (projectId) =>
  Submission.findOne({ projectId });

const updateSubmissionById = (id, payload) =>
  Submission.findByIdAndUpdate(id, payload, { new: true });

const pushTimelineEvent = async (id, event) => {
  await Submission.findByIdAndUpdate(
    id,
    {
      $push: {
        timeline: event,
      },
    },
    { new: true }
  );

  return Submission.findById(id);
};

module.exports = {
  createSubmission,
  findSubmissionById,
  findSubmissionByProjectId,
  updateSubmissionById,
  pushTimelineEvent,
};