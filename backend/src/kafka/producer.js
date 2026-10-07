import kafka from "../config/kafka.js";

const producer = kafka.producer();

// ---------- CONNECT PRODUCER ----------
export const connectProducer = async () => {
  await producer.connect();
  console.log("✅ Kafka Producer connected successfully");
};

// ------------------------------------------------ 
export const publishEvent = async (topic, event) => {
  try {
    await producer.send({
      topic,
      messages: [
        {
          /* key → optional, used so all events for the same PR
             go to the same partition (keeps ordering per PR) */
          key: event.prId || null,

          /* value MUST be a string — so we JSON.stringify the JS object */
          value: JSON.stringify(event)
        }
      ]
    });

    console.log(`📤 Kafka: Published [${event.eventType}] → [${topic}]`);

  } catch (error) {
    console.error(`❌ Kafka: Failed to publish [${event.eventType}]`, error.message);
    throw error;
  }
};
