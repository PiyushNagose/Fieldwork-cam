const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const reportRoutes = require("./routes/report.routes");
const errorMiddleware = require("./middlewares/error.middleware");
const performanceRoutes = require("./routes/performance.routes");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Report Service is healthy",
  });
});

app.use("/reports", reportRoutes);
app.use("/performance", performanceRoutes);

app.use(errorMiddleware);

module.exports = app;