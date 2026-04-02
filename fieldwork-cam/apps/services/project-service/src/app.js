const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const projectRoutes = require("./routes/project.routes");
const errorMiddleware = require("./middlewares/error.middleware");
const serviceRoutes = require("./routes/service.routes");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Project Service is healthy",
  });
});

app.use("/projects", projectRoutes);
app.use("/services", serviceRoutes);

app.use(errorMiddleware);

module.exports = app;
