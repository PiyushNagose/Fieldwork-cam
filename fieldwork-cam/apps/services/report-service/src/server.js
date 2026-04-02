const app = require("./app");
const env = require("./config/env");
const connectDB = require("./config/db");

const startServer = async () => {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`Report Service running on http://localhost:${env.PORT}`);
  });
};

startServer();