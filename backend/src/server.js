import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/db.js";
import { connectRedis } from "./config/redis.js";
import app from "./app.js";

/* ---------- KAFKA ADDED ----------
   Import producer + both consumers so they start at server boot.
   
   Think of it like connectDB() — you call it once at startup
   and it stays connected for the whole life of the server.
   
   Order matters:
     1. connectDB()              → MongoDB ready
     2. connectRedis()           → Redis/BullMQ ready
     3. connectProducer()        → Kafka producer ready (controller can now publish events)
     4. startAIReviewConsumer()  → starts listening to "pr-review-events"
     5. startNotificationConsumer() → starts listening to "pr-lifecycle-events"
     6. app.listen()             → server starts accepting HTTP requests
     
   Why this order?
     Producer must connect BEFORE server accepts requests —
     otherwise a PR creation request could arrive and publishEvent()
     would fail because producer isn't connected yet.
------------------------------------------------ */
import { createTopics } from "./kafka/admin.js";
import { connectProducer } from "./kafka/producer.js";
import { startAIReviewConsumer } from "./kafka/consumers/aiReview.consumer.js";
import { startNotificationConsumer } from "./kafka/consumers/notification.consumer.js";

// ✅ OUTBOX: worker that polls MongoDB and publishes pending events to Kafka
import { startOutboxWorker } from "./kafka/outbox/outbox.worker.js";

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => connectRedis())
   .then(() => createTopics())
  // ✅ NEW: Kafka producer + consumers start after DB and Redis are ready
  .then(() => connectProducer())
  .then(() => startAIReviewConsumer())
  .then(() => startNotificationConsumer())

  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  
    // ✅ OUTBOX: start polling MongoDB for pending events
    // Called here (inside .then) so DB is guaranteed to be connected
    startOutboxWorker();
  })
  .catch((err) => {
    console.error("Server startup failed", err);
  });
