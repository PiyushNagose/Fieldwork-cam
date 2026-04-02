const app = require("./app");
const connectDB = require("./config/db");
const { connectRabbitMQ } = require("./config/rabbitmq");
const { startAuthConsumer } = require("./consumers/auth.consumer");
const env = require("./config/env");

const startServer = async () => {
  try {
    await connectDB();
    await connectRabbitMQ();
    await startAuthConsumer();

    app.listen(env.PORT, () => {
      console.log(`User service running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("User service startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
