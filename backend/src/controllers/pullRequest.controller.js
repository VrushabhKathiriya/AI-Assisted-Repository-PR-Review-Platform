import { PullRequest } from "../models/pullRequest.model.js";
import { File } from "../models/file.model.js";
import { Repository } from "../models/repository.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createNotification } from "../utils/createNotification.js";
import { createActivity } from "../utils/createActivity.js";
import { publishEvent } from "../kafka/producer.js";
import { TOPICS, EVENTS } from "../kafka/topics.js";
import { Outbox } from "../kafka/outbox/outbox.model.js";
import mongoose from "mongoose";

/* ---------- RULE HANDLERS ---------- */
const ruleHandlers = {
  minCommitMessageLength: (value, { message }) => {
    if (message.length < value) return "Commit message too short";
  },

  disallowTodo: (value, { content }) => {
    if (value && content.includes("TODO")) return "TODO is not allowed";
  },

  disallowConsoleLog: (value, { content }) => {
    if (value && content.includes("console.log"))
      return "console.log is not allowed";
  },

  disallowVar: (value, { content }) => {
    if (value && /\bvar\b/.test(content))
      return "var keyword is not allowed, use let or const";
  },

  requireIssueLink: (value, { message }) => {
    if (value && !message.includes("#"))
      return "Commit message must reference an issue (e.g. #123)";
  },

  maxFileLines: (value, { content }) => {
    const lines = content.split("\n").length;
    if (lines > value)
      return `File exceeds maximum allowed lines (${value})`;
  },

  disallowDebugger: (value, { content }) => {
    if (value && content.includes("debugger"))
      return "debugger statement is not allowed";
  }
};

/* ================= CREATE PR ================= */
export const createPullRequest = asyncHandler(async (req, res) => {
  const { fileId } = req.params;
  const { content, message } = req.body;

  /* ---------- VALIDATION ---------- */
  if (!content || !message) {
    throw new ApiError(400, "Content and message are required");
  }

  if (message.length > 100) {
    throw new ApiError(400, "Commit message too long");
  }

  /* ---------- FETCH FILE ---------- */
  const file = await File.findById(fileId);

  if (!file) {
    throw new ApiError(404, "File not found");
  }

  /* ---------- FETCH REPO ---------- */
  const repo = await Repository.findById(file.repository);

  if (!repo) {
    throw new ApiError(404, "Repository not found");
  }

  /* ---------- ACCESS CONTROL ---------- */
  const isOwner =
    repo.owner.toString() === req.user._id.toString();

  const isContributor = repo.contributors.some(
    (c) => c.toString() === req.user._id.toString()
  );

  if (!isOwner && !isContributor) {
    throw new ApiError(403, "You are not allowed to create PR");
  }

  /* ---------- NORMALIZE ---------- */
  const normalize = (str) => {
    if (!str || typeof str !== "string") return "";

    return str.trim().replace(/\r\n/g, "\n");
  };

  const normalizedContent = normalize(content);

  /* ---------- PREVENT DUPLICATE PENDING PR ---------- */
  const existingPendingPR = await PullRequest.findOne({
    file: fileId,
    status: "pending"
  });

  if (existingPendingPR) {
    throw new ApiError(
      409,
      "A pending PR already exists for this file. Review it before creating a new one."
    );
  }

  /* ---------- PREVENT SAME CONTENT AS LAST PR ---------- */
  const lastPR = await PullRequest.findOne(
    { file: fileId },
    {},
    { sort: { createdAt: -1 } }
  );

  if (
    lastPR &&
    normalize(lastPR.newContent) === normalizedContent
  ) {
    throw new ApiError(
      400,
      "No changes detected — content is same as the previous PR"
    );
  }

  /* ---------- PREVENT SAME CONTENT AS CURRENT FILE ---------- */
  const currentContent = normalize(file.content || "");

  if (currentContent === normalizedContent) {
    throw new ApiError(
      400,
      "No changes detected — content is same as current file"
    );
  }

  /* ---------- RULE ENGINE ---------- */
  const rules = repo.rules || {};
  const issues = [];

  Object.entries(rules).forEach(([rule, value]) => {
    const handler = ruleHandlers[rule];

    if (handler) {
      const error = handler(value, {
        content,
        message
      });

      if (error) {
        issues.push(error);
      }
    }
  });

  const ruleResult = {
    passed: issues.length === 0,
    issues
  };

  /* ---------- CREATE PR ---------- */

  // const pullRequest = await PullRequest.create({
  //   repository: repo._id,
  //   file: fileId,
  //   createdBy: req.user._id,
  //   newContent: content,
  //   message,
  //   ruleResult

  //   // aiResult is intentionally not provided.
  //   // Schema default:
  //   // aiResult = null
  //   // aiReviewStatus = "pending"
  // });

  /* ---------- ADD AI REVIEW JOB ---------- */

  //  OLD: directly added BullMQ job from controller
  // await aiReviewQueue.add("review-pr", {
  //   prId: pullRequest._id.toString()
  // });

  //  NEW: publish to Kafka → aiReview.consumer.js picks this up → adds BullMQ job
  // The actual Gemini processing still happens in aiReview.worker.js (unchanged)
  // await publishEvent(TOPICS.PR_REVIEW_EVENTS, {
  //   eventType: EVENTS.PR_REVIEW_REQUESTED,
  //   prId: pullRequest._id.toString()
  // });

    /* ---------- CREATE PR + OUTBOX (atomic transaction) ----------
     
     Previously:
       PullRequest.create()  → MongoDB
       publishEvent()        → Kafka  (could fail independently)
     
     Now (Outbox Pattern):
       MongoDB Transaction:
         ├── PullRequest.create()   ← PR saved
         └── Outbox.create() × 2   ← event intents saved
       COMMIT (all 3 writes happen together, or none)
       
       Later → outbox.worker.js reads these and publishes to Kafka
  ------------------------------------------------ */

  const session = await mongoose.startSession();
  session.startTransaction();

  let pullRequest;

  try {
    /* Save PR inside transaction */
    const [createdPR] = await PullRequest.create(
      [
        {
          repository: repo._id,
          file: fileId,
          createdBy: req.user._id,
          newContent: content,
          message,
          ruleResult
        }
      ],
      { session }
    );

    pullRequest = createdPR;

    /* Save AI review event intent to Outbox (same transaction) */
    /* OLD: await publishEvent(TOPICS.PR_REVIEW_EVENTS, { eventType: EVENTS.PR_REVIEW_REQUESTED, prId: pullRequest._id.toString() }); */
    await Outbox.create(
      [
        {
          topic:     TOPICS.PR_REVIEW_EVENTS,
          eventType: EVENTS.PR_REVIEW_REQUESTED,
          payload:   { prId: pullRequest._id.toString() }
        }
      ],
      { session }
    );

    /* Save PR_CREATED notification event intent to Outbox (same transaction) */
    /* OLD: await publishEvent(TOPICS.PR_LIFECYCLE_EVENTS, { eventType: EVENTS.PR_CREATED, ... }); */
    await Outbox.create(
      [
        {
          topic:     TOPICS.PR_LIFECYCLE_EVENTS,
          eventType: EVENTS.PR_CREATED,
          payload:   {
            prId:        pullRequest._id.toString(),
            repoId:      repo._id.toString(),
            repoOwnerId: repo.owner.toString(),
            createdBy:   req.user._id.toString(),
            fileName:    file.name,
            username:    req.user.username
          }
        }
      ],
      { session }
    );

    /* All 3 writes succeed together */
    await session.commitTransaction();

  } catch (error) {
    /* Any failure → rollback everything — PR + both Outbox records */
    await session.abortTransaction();
    throw error;

  } finally {
    session.endSession();
  }


  /* ---------- ACTIVITY ---------- */

  await createActivity({
    repository: repo._id,
    performedBy: req.user._id,
    type: "pr_created",
    message: `${req.user.username} created a PR on file ${file.name}`,
    file: file._id,
    pullRequest: pullRequest._id
  });

    /* ---------- NOTIFY REPO OWNER ---------- */

  //  OLD: directly called createNotification() from controller
  // await createNotification({
  //   recipient: repo.owner,
  //   sender: req.user._id,
  //   type: "pr_created",
  //   message: `${req.user.username} created a new PR on file ${file.name}`,
  //   repository: repo._id,
  //   pullRequest: pullRequest._id
  // });

  //  NEW: publish to Kafka → notification.consumer.js picks this up → saves Notification
  // await publishEvent(TOPICS.PR_LIFECYCLE_EVENTS, {
  //   eventType:   EVENTS.PR_CREATED,
  //   prId:        pullRequest._id.toString(),
  //   repoId:      repo._id.toString(),
  //   repoOwnerId: repo.owner.toString(),
  //   createdBy:   req.user._id.toString(),
  //   fileName:    file.name,
  //   username:    req.user.username
  // });


  /* ---------- RESPONSE ---------- */

  return res.status(201).json(
    new ApiResponse(
      201,
      pullRequest,
      "Pull request created. AI review is processing."
    )
  );
});

/* ================= REVIEW PR ================= */
export const reviewPullRequest = asyncHandler(async (req, res) => {
  const { prId } = req.params;
  const { action } = req.body;

  if (!["accept", "reject"].includes(action)) {
    throw new ApiError(400, "Invalid action");
  }

  const pr = await PullRequest.findById(prId);
  if (!pr) throw new ApiError(404, "PR not found");

  if (pr.status !== "pending") {
    throw new ApiError(400, "PR already reviewed");
  }

  const repo = await Repository.findById(pr.repository);
  if (!repo) throw new ApiError(404, "Repository not found");

  if (repo.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only owner can review PR");
  }

  /* ---------- ACCEPT ---------- */
  if (action === "accept") {
    const file = await File.findById(pr.file);
    if (!file) throw new ApiError(404, "File not found");

    file.versions.push({
      content: pr.newContent,
      message: pr.message,
      updatedBy: pr.createdBy
    });

    file.content = pr.newContent;
    await file.save();
    pr.status = "accepted";

    await createActivity({
      repository: pr.repository,
      performedBy: req.user._id,
      type: "pr_accepted",
      message: `${req.user.username} accepted a PR`,
      pullRequest: pr._id
    });
  }

  /* ---------- REJECT ---------- */
  if (action === "reject") {
    pr.status = "rejected";
    await createActivity({
      repository: pr.repository,
      performedBy: req.user._id,
      type: "pr_rejected",
      message: `${req.user.username} rejected a PR`,
      pullRequest: pr._id
    });
  }

  pr.reviewedBy = req.user._id;
  pr.reviewedAt = new Date();
  // OLD : await pr.save();

  /* ---------- NOTIFY PR CREATOR ---------- */

  // OLD: directly called createNotification() from controller
  // await createNotification({
  //   recipient: pr.createdBy,
  //   sender: req.user._id,
  //   type: action === "accept" ? "pr_accepted" : "pr_rejected",
  //   message: `Your PR was ${action === "accept" ? "accepted" : "rejected"} by ${req.user.username}`,
  //   repository: pr.repository,
  //   pullRequest: pr._id
  // });

  //  NEW: publish to Kafka → notification.consumer.js picks this up → saves Notification
  // await publishEvent(TOPICS.PR_LIFECYCLE_EVENTS, {
  //   eventType:        action === "accept" ? EVENTS.PR_ACCEPTED : EVENTS.PR_REJECTED,
  //   prId:             pr._id.toString(),
  //   repoId:           pr.repository.toString(),
  //   prCreatorId:      pr.createdBy.toString(),
  //   reviewedBy:       req.user._id.toString(),
  //   reviewerUsername: req.user.username
  // });


  // OLD: directly called createNotification() from controller
  // await createNotification({...});
  

  // ------------------outbox for Pr review with ATOMIC TRANSACTION: pr.save() + Outbox.create() ------------
  // OLD (direct Kafka): await publishEvent(TOPICS.PR_LIFECYCLE_EVENTS, {...});
  
  //  OUTBOX: save event intent to MongoDB → outbox worker publishes to Kafka
  /*
  Why transaction here?
       Without it: pr.save()  → app crashes → Outbox.create() 
       Result: PR is marked accepted/rejected in DB but
               notification event never saved → owner never notified */
  
  const reviewSession = await mongoose.startSession();
  reviewSession.startTransaction();

  try{
    await pr.save({ session: reviewSession });

    await Outbox.create(
      [
        {
          topic:     TOPICS.PR_LIFECYCLE_EVENTS,
          eventType: action === "accept" ? EVENTS.PR_ACCEPTED : EVENTS.PR_REJECTED,
          payload:   {
            prId:             pr._id.toString(),
            repoId:           pr.repository.toString(),
            prCreatorId:      pr.createdBy.toString(),
            reviewedBy:       req.user._id.toString(),
            reviewerUsername: req.user.username
          }
        }
      ],
      { session: reviewSession }    // ← same session as pr.save()
    );

    await reviewSession.commitTransaction();
  }catch (error) {
    /* Either write failed → rollback both */
    await reviewSession.abortTransaction();
    throw error;
  } finally {
    reviewSession.endSession();
  }

  return res
    .status(200)
    .json(new ApiResponse(200, pr, `PR ${action}ed successfully`));
});

/* ================= GET PRs BY REPO ================= */
export const getPullRequests = asyncHandler(async (req, res) => {
  const { repoId } = req.params;

  const repo = await Repository.findById(repoId);
  if (!repo) throw new ApiError(404, "Repository not found");

  const isOwner = repo.owner.toString() === req.user._id.toString();
  const isContributor = repo.contributors.some(
    (c) => c.toString() === req.user._id.toString()
  );
  const isPublic = repo.visibility === "public";

  if (!isOwner && !isContributor && !isPublic) {
    throw new ApiError(403, "Access denied");
  }

  const prs = await PullRequest.find({ repository: repoId })
    .populate("createdBy", "username email")
    .populate("file", "name")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, prs, "PRs fetched successfully"));
});

/* ================= GET AI REVIEW STATUS ================= */
export const getAIReviewStatus = asyncHandler(async (req, res) => {
  const { prId } = req.params;


  const pr = await PullRequest.findById(prId).select("aiReviewStatus aiResult");

  if (!pr) {
    throw new ApiError(404, "Pull request not found");
  }

  const data =
    pr.aiReviewStatus === "completed"
      ? { aiReviewStatus: pr.aiReviewStatus, aiResult: pr.aiResult }
      : { aiReviewStatus: pr.aiReviewStatus };

  return res
    .status(200)
    .json(new ApiResponse(200, data, "AI review status fetched"));
});
