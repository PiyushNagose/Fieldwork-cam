const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const userRoutes = require("./routes/user.routes");
const vendorRoutes = require("./routes/vendor.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const staffRoutes = require("./routes/staff.routes");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "User Service is healthy",
  });
});

app.use("/users", userRoutes);
app.use("/vendors", vendorRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/team", staffRoutes);

app.use(errorMiddleware);

module.exports = app;
