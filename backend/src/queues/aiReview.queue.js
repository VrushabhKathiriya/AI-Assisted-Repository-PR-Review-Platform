import { Queue } from "bullmq";
import bullmqRedis from "../config/bullmqRedis.js";

export const aiReviewQueue = new Queue("ai-review", {
  connection: bullmqRedis,
  
  defaultJobOptions: {
    attempts: 3,

    backoff: {
      type: "exponential",
      delay: 5000
    }
  }
});