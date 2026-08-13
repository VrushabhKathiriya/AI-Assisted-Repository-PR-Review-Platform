import { PullRequest } from "../models/pullRequest.model.js";
import { File } from "../models/file.model.js";
import { Repository } from "../models/repository.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createNotification } from "../utils/createNotification.js";
import { createActivity } from "../utils/createActivity.js";
import { aiReviewQueue } from "../queues/aiReview.queue.js";

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

  /* ---------- AI REVIEW ----------
  
     AI review is now handled by the background worker.
     We DO NOT call getAIReview() here.

     const aiResult = await getAIReview({
       content,
       message,
       ruleIssues: issues,
       previousContent: file.content || null
     });

  ------------------------------------------------ */

  /* ---------- CREATE PR ---------- */

  const pullRequest = await PullRequest.create({
    repository: repo._id,
    file: fileId,
    createdBy: req.user._id,
    newContent: content,
    message,
    ruleResult

    // aiResult is intentionally not provided.
    // Schema default:
    // aiResult = null
    // aiReviewStatus = "pending"
  });

  /* ---------- ADD AI REVIEW JOB ---------- */

  await aiReviewQueue.add("review-pr", {
    prId: pullRequest._id.toString()
  });

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

  await createNotification({
    recipient: repo.owner,
    sender: req.user._id,
    type: "pr_created",
    message: `${req.user.username} created a new PR on file ${file.name}`,
    repository: repo._id,
    pullRequest: pullRequest._id
  });

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
  await pr.save();

  /* ---------- NOTIFY PR CREATOR ---------- */
  await createNotification({
    recipient: pr.createdBy,
    sender: req.user._id,
    type: action === "accept" ? "pr_accepted" : "pr_rejected",
    message: `Your PR was ${action === "accept" ? "accepted" : "rejected"} by ${req.user.username}`,
    repository: pr.repository,
    pullRequest: pr._id
  });

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
