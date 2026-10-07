import { Kafka } from "kafkajs";

/* ---------- KAFKA CLIENT ----------
   Just like db.js connects to MongoDB,
   and bullmqRedis.js connects to Redis —
   this file connects to Kafka.

   clientId  = a name so Kafka logs can identify this app
   brokers   = the address of your Kafka server
               → localhost:9092 when running locally via Docker
               → change to cloud URL in production
------------------------------------------------ */

const kafka = new Kafka({
  clientId: "ai-pr-review-app",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"]
});

export default kafka;
