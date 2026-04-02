const app = require("./app");
const connectDB = require("./config/db");
const env = require("./config/env");
const { connectRabbitMQ } = require("./config/rabbitmq");
const startConsumer = require("./events/notification.consumer");

const start = async () => {
  await connectDB();
  await connectRabbitMQ();
  await startConsumer();

  app.listen(env.PORT, () => {
    console.log(`Notification Service running on ${env.PORT}`);
  });
};

start();
