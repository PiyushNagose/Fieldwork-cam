const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const env = require("./config/env");
const mediaRoutes = require("./routes/media.routes");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use(`/${env.UPLOAD_DIR}`, express.static(path.join(process.cwd(), env.UPLOAD_DIR)));

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Media Service is healthy",
  });
});

app.use("/media", mediaRoutes);

app.use(errorMiddleware);

module.exports = app;