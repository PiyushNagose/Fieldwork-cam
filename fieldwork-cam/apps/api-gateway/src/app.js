const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const requestLogger = require("./middlewares/requestLogger.middleware");
const errorMiddleware = require("./middlewares/error.middleware");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const projectRoutes = require("./routes/project.routes");
const notificationRoutes = require("./routes/notification.routes");
const teamRoutes = require("./routes/team.routes");
const supportRoutes = require("./routes/support.routes");
const mediaRoutes = require("./routes/media.routes");
const aiRoutes = require("./routes/ai.routes");
const reportRoutes = require("./routes/report.routes");
const invoiceRoutes = require("./routes/invoice.routes");
const performanceRoutes = require("./routes/performance.routes");
const submissionRoutes = require("./routes/submission.routes");
const serviceRoutes = require("./routes/service.routes");
const vendorRoutes = require("./routes/vendor.routes");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API Gateway is healthy",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/vendors", vendorRoutes);

app.use(errorMiddleware);

module.exports = app;
