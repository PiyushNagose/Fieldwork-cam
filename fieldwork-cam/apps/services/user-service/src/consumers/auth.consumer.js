const { getChannel } = require("../config/rabbitmq");
const { EXCHANGES, ROUTING_KEYS } = require("shared-events");
const userService = require("../services/user.service");

const startAuthConsumer = async () => {
  try {
    const channel = getChannel();

    if (!channel) {
      console.error(
        "User Service Consumer Error: RabbitMQ channel not available",
      );
      return;
    }

    await channel.assertExchange(EXCHANGES.FIELDWORK_EVENTS, "topic", {
      durable: true,
    });

    const assertedQueue = await channel.assertQueue("user-service-auth-queue", {
      durable: true,
    });

    await channel.bindQueue(
      assertedQueue.queue,
      EXCHANGES.FIELDWORK_EVENTS,
      ROUTING_KEYS.AUTH_USER_VERIFIED,
    );

    channel.consume(assertedQueue.queue, async (message) => {
      if (!message) return;

      try {
        const payload = JSON.parse(message.content.toString());
        console.log("Event Received:", payload);

        if (!payload?.userId || !payload?.phone || !payload?.role) {
          throw new Error("Invalid auth event payload");
        }

        await userService.ensureUserFromAuthEvent({
          authUserId: payload.userId,
          phone: payload.phone,
          role: payload.role,
          isVerified: payload.isVerified,
        });

        channel.ack(message);
      } catch (error) {
        console.error("User Service Consumer Error:", error.message);
        channel.nack(message, false, false);
      }
    });

    console.log("User Service auth consumer started");
  } catch (error) {
    console.error("Failed to start auth consumer:", error.message);
  }
};

module.exports = { startAuthConsumer };
