import kafka from "../config/kafka.js";
import { TOPICS } from "./topics.js";

/* ---------- KAFKA ADMIN — CREATE TOPICS ----------
   Topics must exist in Kafka before consumers can subscribe to them.
   
   numPartitions: 1  → fine for development / small scale
   replicationFactor: 1 → only 1 Kafka broker running locally,
                           so replication factor must be 1
------------------------------------------------ */

export const createTopics = async () => {
  const admin = kafka.admin();

  try {
    await admin.connect();
    console.log("Kafka Admin connected");

    await admin.createTopics({
      waitForLeaders: true,   // wait until topics are fully ready
      topics: [
        {
          topic: TOPICS.PR_REVIEW_EVENTS,       
          numPartitions: 1,
          replicationFactor: 1
        },
        {
          topic: TOPICS.PR_LIFECYCLE_EVENTS,    
          numPartitions: 1,
          replicationFactor: 1
        }
      ]
    });

    console.log("Kafka topics created (or already exist)");

  } catch (error) {
    console.error("Kafka topic creation failed:", error.message);
    throw error;
  } finally {
    await admin.disconnect();   // admin is only needed for setup, disconnect after
  }
};
