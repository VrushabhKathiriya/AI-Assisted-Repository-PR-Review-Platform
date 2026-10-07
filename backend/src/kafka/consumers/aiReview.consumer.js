import kafka from "../../config/kafka.js";
import { TOPICS, EVENTS } from "../topics.js";
import { aiReviewQueue } from "../../queues/aiReview.queue.js";

// ---------- AI-REVIEW CONSUMER ----------
const consumer = kafka.consumer({
  groupId: "ai-review-consumer-group"
}); 

export const startAIReviewConsumer = async () => {

  /* Step 1: Connect this consumer to the Kafka broker */
  await consumer.connect();
  console.log("AI Review Consumer connected to Kafka");

  /* Step 2: Tell Kafka which topic to listen to
     fromBeginning: false → only receive NEW messages from now on
                            (don't replay old ones from before server started) */
  await consumer.subscribe({
    topic: TOPICS.PR_REVIEW_EVENTS,
    fromBeginning: false
  });

  /* Step 3: Start the listening loop — runs FOREVER
     Every time a new message arrives in "pr-review-events",
     the eachMessage function fires automatically.

     Breakdown of { message }:
       message.value           → raw bytes from Kafka (not readable yet)
       message.value.toString()→ converts bytes to string: '{"eventType":"PR_REVIEW_REQUESTED","prId":"abc"}'
       JSON.parse(...)         → converts string to JS object: { eventType: "PR_REVIEW_REQUESTED", prId: "abc" }
  */
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {

      const event = JSON.parse(message.value.toString());

      console.log(`📨 AI Review Consumer: Received [${event.eventType}]`, { prId: event.prId });

      /* Only handle PR_REVIEW_REQUESTED — ignore anything else */
      if (event.eventType === EVENTS.PR_REVIEW_REQUESTED) {

        /* This is the same call that was in pullRequest.controller.js before */
        await aiReviewQueue.add("review-pr", {
          prId: event.prId
        });

        console.log(`✅ AI Review Consumer: BullMQ job added for PR [${event.prId}]`);
      }
    }
  });
};
