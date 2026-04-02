const amqp = require("amqplib");
const env = require("./env");

let channel = null;
let connection = null;
let isConnecting = false;

const connectRabbitMQ = async () => {
  if (isConnecting) return channel;
  isConnecting = true;

  try {
    connection = await amqp.connect(`${env.RABBITMQ_URL}?heartbeat=60`);

    connection.on("error", (err) => {
      console.error("RabbitMQ connection error:", err.message);
    });

    connection.on("close", () => {
      console.error("RabbitMQ connection closed. Reconnecting in 5 seconds...");
      channel = null;
      connection = null;
      setTimeout(() => {
        connectRabbitMQ();
      }, 5000);
    });

    channel = await connection.createChannel();

    channel.on("error", (err) => {
      console.error("RabbitMQ channel error:", err.message);
    });

    channel.on("close", () => {
      console.warn("RabbitMQ channel closed");
    });

    console.log("User Service RabbitMQ connected");
    return channel;
  } catch (error) {
    console.error("User Service RabbitMQ connection failed:", error.message);

    channel = null;
    connection = null;

    setTimeout(() => {
      connectRabbitMQ();
    }, 5000);

    return null;
  } finally {
    isConnecting = false;
  }
};

const getChannel = () => channel;

module.exports = {
  connectRabbitMQ,
  getChannel,
};
