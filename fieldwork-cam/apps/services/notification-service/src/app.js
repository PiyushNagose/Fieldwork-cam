const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const routes = require("./routes/notification.routes");
const errorMiddleware = require("./middlewares/error.middleware");
const ticketRoutes = require("./routes/ticket.routes");
const supportRoutes = require("./routes/support.routes");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ success: true, message: "Notification Service OK" });
});

app.use("/notifications", routes);
app.use("/tickets", ticketRoutes);
app.use("/support", supportRoutes);

app.use(errorMiddleware);

module.exports = app;
