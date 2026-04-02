const { getChannel } = require("../config/rabbitmq");
const { EXCHANGES } = require("shared-events");

const publishEvent = async (routingKey, payload) => {
  const channel = getChannel();

  if (!channel) {
    throw new Error("RabbitMQ channel not available in publisher");
  }

  await channel.assertExchange(EXCHANGES.FIELDWORK_EVENTS, "topic", {
    durable: true,
  });

  console.log("Publishing routing key:", routingKey);
  console.log("Publishing payload:", payload);

  channel.publish(
    EXCHANGES.FIELDWORK_EVENTS,
    routingKey,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true },
  );
};

module.exports = { publishEvent };
