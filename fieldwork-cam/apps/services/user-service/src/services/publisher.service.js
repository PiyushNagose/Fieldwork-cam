const { getChannel } = require("../config/rabbitmq");
const { EXCHANGES, ROUTING_KEYS } = require("shared-events");

const publishEvent = async (routingKey, payload) => {
  const channel = getChannel();
  if (!channel) return;

  await channel.assertExchange(EXCHANGES.FIELDWORK_EVENTS, "topic", {
    durable: true,
  });

  channel.publish(
    EXCHANGES.FIELDWORK_EVENTS,
    routingKey,
    Buffer.from(JSON.stringify(payload))
  );
};

module.exports = { publishEvent };