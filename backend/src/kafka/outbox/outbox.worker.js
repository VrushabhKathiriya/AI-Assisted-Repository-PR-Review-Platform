import { Outbox } from "./outbox.model.js";
import { publishEvent } from "../producer.js";

/* ---------- OUTBOX WORKER ----------
   This worker runs on a setInterval every 3 seconds.
   
   Its only job:
     1. Find all Outbox records where status = "pending"
     2. For each → publish to Kafka using publishEvent()
     3. On success → mark status = "published"
     4. On failure → increment attempts, mark as "failed" after 5 tries
   
   Why this is needed:
     The controller no longer calls Kafka directly.
     It writes to the Outbox (MongoDB) instead.
     This worker bridges Outbox → Kafka.
   
   If Kafka is down:
     Records stay as "pending" in the Outbox.
     Worker retries every 3 seconds.
     When Kafka recovers → records are published and marked "published".
     Zero events lost.

   Max attempts = 5:
     After 5 failures → status = "failed" (dead letter)
     Prevents infinite retry loops for genuinely bad events.
------------------------------------------------ */

const MAX_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 3000; // 3 seconds

export const startOutboxWorker = () => {

  console.log("✅ Outbox Worker started — polling every 3 seconds");

  setInterval(async () => {

    try {
      /* Find all events not yet published, ordered oldest first */
      const pendingEvents = await Outbox.find({ status: "pending" })
        .sort({ createdAt: 1 })   // oldest first → preserve event order
        .limit(50);               // process max 50 at a time per cycle

      if (pendingEvents.length === 0) return; 

      console.log(`📬 Outbox Worker: Found ${pendingEvents.length} pending event(s)`);

      for (const outboxRecord of pendingEvents) {

        try {
          /* Publish the event to Kafka */
          await publishEvent(outboxRecord.topic, {
            eventType: outboxRecord.eventType,
            ...outboxRecord.payload   // spread all payload fields
          });

          /* Success → mark as published */
          await Outbox.findByIdAndUpdate(outboxRecord._id, {
            status: "published",
            $inc: { attempts: 1 }
          });

          console.log(`✅ Outbox Worker: Published [${outboxRecord.eventType}] → [${outboxRecord.topic}]`);

        } catch (publishError) {
          /* Kafka publish failed for this record */
          const newAttempts = outboxRecord.attempts + 1;

          if (newAttempts >= MAX_ATTEMPTS) {
            /* Too many failures → mark as failed (stop retrying) */
            await Outbox.findByIdAndUpdate(outboxRecord._id, {
              status: "failed",
              attempts: newAttempts
            });

            console.error(
              `❌ Outbox Worker: Event [${outboxRecord.eventType}] failed after ${MAX_ATTEMPTS} attempts. Marked as failed.`
            );
          } else {
            /* Still has attempts left → increment counter, stay "pending" */
            await Outbox.findByIdAndUpdate(outboxRecord._id, {
              attempts: newAttempts
            });

            console.warn(
              `⚠️ Outbox Worker: Event [${outboxRecord.eventType}] failed (attempt ${newAttempts}/${MAX_ATTEMPTS}). Will retry.`
            );
          }
        }
      }

    } catch (error) {
      /* DB error while reading outbox — log and continue */
      console.error("❌ Outbox Worker: Error reading outbox collection:", error.message);
    }

  }, POLL_INTERVAL_MS);
};
