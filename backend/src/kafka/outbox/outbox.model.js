import mongoose, { Schema } from "mongoose";

/* ---------- OUTBOX MODEL ----------
   The Outbox collection stores "pending Kafka events".

   Why does this exist?
     Without Outbox:
       Controller → MongoDB write ✅
       Controller → Kafka publish ❌ (can fail independently)
       = inconsistent state (PR saved, event never sent)

     With Outbox:
       Controller → MongoDB Transaction:
                      ├── PullRequest.create() ✅
                      └── Outbox.create()      ✅  ← event intent saved
                    COMMIT (both or neither)
       Later → Outbox Worker reads this and publishes to Kafka
       = guaranteed delivery, consistent state

   Fields:
     topic      → which Kafka topic to publish to
     eventType  → what kind of event (PR_CREATED, PR_REVIEW_REQUESTED, etc.)
     payload    → the data to send (prId, repoId, etc.)
     status     → "pending" → "published" (or stays pending if Kafka fails)
     createdAt  → when the event was created
------------------------------------------------ */

const outboxSchema = new Schema(
  {
    /* Which Kafka topic to publish to */
    topic: {
      type: String,
      required: true
    },

    /* What type of event this is */
    eventType: {
      type: String,
      required: true
    },

    /* The actual event data — stored as a JS object and Mixed type means "any JS object" — flexible enough for all event payloads. */
    payload: {
      type: Schema.Types.Mixed,
      required: true
    },

    /* 
      pending   → not yet published to Kafka (just created)
      published → successfully sent to Kafka
      failed    → tried multiple times, still failing
    */
    status: {
      type: String,
      enum: ["pending", "published", "failed"],
      default: "pending"
    },

    /* How many times the outbox worker tried to publish this */
    attempts: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

/* Index for fast lookup of pending events */
outboxSchema.index({ status: 1, createdAt: 1 });

export const Outbox = mongoose.model("Outbox", outboxSchema);
