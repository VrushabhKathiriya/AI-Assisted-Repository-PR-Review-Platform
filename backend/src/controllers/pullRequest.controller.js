import { PullRequest } from "../models/pullRequest.model.js";
import { File } from "../models/file.model.js";
import { Repository } from "../models/repository.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

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

  if (message.length > 30) {
    throw new ApiError(400, "Commit message too long");
  }

  /* ---------- FETCH FILE ---------- */
  const file = await File.findById(fileId);
  if (!file) throw new ApiError(404, "File not found");

  /* ---------- FETCH REPO ---------- */
  const repo = await Repository.findById(file.repository);
  if (!repo) throw new ApiError(404, "Repository not found");

  /* ---------- ACCESS CONTROL ---------- */
  const isOwner = repo.owner.toString() === req.user._id.toString();
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

  /* ---------- PREVENT SAME CONTENT AS LAST PR (accepted or rejected) ---------- */
  const lastPR = await PullRequest.findOne(
    { file: fileId },
    {},
    { sort: { createdAt: -1 } }
  );

  if (lastPR && normalize(lastPR.newContent) === normalizedContent) {
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
      const error = handler(value, { content, message });
      if (error) issues.push(error);
    }
  });

  const ruleResult = {
    passed: issues.length === 0,
    issues
  };

  /* ---------- AI LAYER ---------- */
  let aiResult = {
    status: "good",
    suggestions: ["Code meets repository rules"],
    explanation: "No issues detected"
  };

  if (!ruleResult.passed) {
    aiResult = {
      status: "bad",
      suggestions: ruleResult.issues.map((issue) => `Fix: ${issue}`),
      explanation: "Code violates repository rules"
    };
  }

  /* ---------- CREATE PR ---------- */
  const pr = await PullRequest.create({
    repository: repo._id,
    file: fileId,
    createdBy: req.user._id,
    newContent: content,
    message,
    ruleResult,
    aiResult
  });

  return res
    .status(201)
    .json(new ApiResponse(201, pr, "Pull request created successfully"));
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

    file.content = pr.newContent; // 🔥 IMPORTANT (latest content update)

    await file.save();

    pr.status = "accepted";
  }

  /* ---------- REJECT ---------- */
  if (action === "reject") {
    pr.status = "rejected";
  }

  pr.reviewedBy = req.user._id;
  pr.reviewedAt = new Date();

  await pr.save();

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