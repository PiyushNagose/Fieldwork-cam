const { getChannel, EXCHANGE } = require("../config/rabbitmq");
const {
  createNotification,
} = require("../repositories/notification.repository");

const QUEUE = "notification_queue";

const startConsumer = async () => {
  const channel = getChannel();

  await channel.assertQueue(QUEUE, { durable: true });

  // bind events
  await channel.bindQueue(QUEUE, EXCHANGE, "project.*");

  channel.consume(QUEUE, async (msg) => {
    if (!msg) return;

    const routingKey = msg.fields.routingKey;
    const data = JSON.parse(msg.content.toString());

    console.log("Notification received event:", routingKey);

    try {
      let notificationPayload;

      if (routingKey === "project.created") {
        notificationPayload = {
          userId: data.assignedVendorAuthUserId,
          title: "New Project Assigned",
          message: `Project ${data.title} has been created`,
          type: "PROJECT",
          meta: data,
        };
      }

      if (routingKey === "project.status.updated") {
        notificationPayload = {
          userId: data.assignedVendorAuthUserId,
          title: "Project Status Updated",
          message: `Project ${data.title} is now ${data.status}`,
          type: "PROJECT",
          meta: data,
        };
      }

      if (notificationPayload) {
        await createNotification(notificationPayload);
      }

      channel.ack(msg);
    } catch (error) {
      console.error("Consumer error:", error.message);
      channel.nack(msg);
    }
  });
};

module.exports = startConsumer;
