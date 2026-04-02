const errorMiddleware = (err, req, res, next) => {
  console.error("Gateway Error:", err.message);

  if (err.response) {
    return res.status(err.response.status).json(
      err.response.data || {
        success: false,
        message: "Upstream service error",
      },
    );
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

module.exports = errorMiddleware;
