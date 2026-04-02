const app = require("./app");
const env = require("./config/env");
const connectDB = require("./config/db");
const { connectRabbitMQ } = require("./config/rabbitmq");

const startServer = async () => {
  await connectDB();
  await connectRabbitMQ();

  app.listen(env.PORT, () => {
    console.log(`Auth Service running on http://localhost:${env.PORT}`);
  });
};

startServer();
