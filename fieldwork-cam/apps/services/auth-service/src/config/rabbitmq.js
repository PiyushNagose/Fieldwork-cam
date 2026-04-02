const amqp = require("amqplib");
const env = require("./env");

let connection = null;
let channel = null;
let reconnecting = false;

const connectRabbitMQ = async () => {
  try {
    const url = env.RABBITMQ_URL.includes("?")
      ? `${env.RABBITMQ_URL}&heartbeat=60`
      : `${env.RABBITMQ_URL}?heartbeat=60`;

    connection = await amqp.connect(url);
    channel = await connection.createChannel();

    connection.on("error", (err) => {
      console.error("RabbitMQ connection error:", err.message);
    });

    connection.on("close", () => {
      console.error("RabbitMQ connection closed");
      channel = null;
      connection = null;

      if (!reconnecting) {
        reconnecting = true;
        setTimeout(async () => {
          reconnecting = false;
          console.log("Reconnecting to RabbitMQ...");
          await connectRabbitMQ();
        }, 5000);
      }
    });

    channel.on("error", (err) => {
      console.error("RabbitMQ channel error:", err.message);
    });

    channel.on("close", () => {
      console.warn("RabbitMQ channel closed");
    });

    console.log("Auth Service RabbitMQ connected");
    return channel;
  } catch (error) {
    console.error("RabbitMQ connection failed:", error.message);
    channel = null;
    connection = null;

    if (!reconnecting) {
      reconnecting = true;
      setTimeout(async () => {
        reconnecting = false;
        console.log("Retrying RabbitMQ connection...");
        await connectRabbitMQ();
      }, 5000);
    }

    return null;
  }
};

const getChannel = () => channel;

module.exports = {
  connectRabbitMQ,
  getChannel,
};
