const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const submissionRoutes = require("./routes/submission.routes");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Submission Service is healthy",
  });
});

app.use("/submissions", submissionRoutes);

app.use(errorMiddleware);

module.exports = app;