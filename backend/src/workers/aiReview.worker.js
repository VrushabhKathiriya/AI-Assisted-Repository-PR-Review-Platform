import { Worker } from "bullmq";
import bullmqRedis from "../config/bullmqRedis.js";

import { PullRequest } from "../models/pullRequest.model.js";
import { File } from "../models/file.model.js";

import { getAIReview } from "../services/aiReview.service.js";

import connectDB from "../config/db.js";

await connectDB();

const aiReviewWorker = new Worker(
  "ai-review",

  async (job) => {
    console.log("AI Review Job Received");
    console.log("Job ID:", job.id);
    console.log("Job Data:", job.data);

    const { prId } = job.data;

    /* ---------- FETCH PR ---------- */

    const pullRequest = await PullRequest.findById(prId);

    if (!pullRequest) {
      throw new Error("Pull request not found");
    }

    await pullRequest.populate("file");

    /* ---------- UPDATE STATUS ---------- */

    pullRequest.aiReviewStatus = "processing";
    console.log("AI Review Processing...");

    await pullRequest.save();

    try {
      /* ---------- AI REVIEW ---------- */

      const aiResult = await getAIReview({
        content: pullRequest.newContent,
        message: pullRequest.message,
        ruleIssues: pullRequest.ruleResult.issues,
        previousContent: pullRequest.file?.content || null
      });

      /* ---------- UPDATE PR ---------- */

      pullRequest.aiResult = aiResult;
      pullRequest.aiReviewStatus = "completed";

      await pullRequest.save();

      console.log("AI Review Completed");

    } catch (error) {
        const maxAttempts = 3;

        const isLastAttempt =
            job.attemptsMade + 1 >= maxAttempts;

        if (isLastAttempt) {
            pullRequest.aiReviewStatus = "failed";

            await pullRequest.save();

            console.error("AI Review Failed Permanently");
        } else {
            pullRequest.aiReviewStatus = "retrying";

            await pullRequest.save();

            console.log("AI Review Failed. Retrying...");
        }

        throw error;
    }
  },

  {
    connection: bullmqRedis
  }
);

console.log("AI Review Worker started successfully");