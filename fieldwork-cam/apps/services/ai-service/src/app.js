const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const aiRoutes = require("./routes/ai.routes");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AI Service is healthy",
  });
});

app.use("/ai", aiRoutes);

app.use(errorMiddleware);

module.exports = app;
