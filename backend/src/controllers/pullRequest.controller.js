import { PullRequest } from "../models/pullRequest.model.js";
import { File } from "../models/file.model.js";
import { Repository } from "../models/repository.model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createNotification } from "../utils/createNotification.js";

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

/* ---------- AI REVIEW FUNCTION ---------- */
const getAIReview = async ({ content, message, ruleIssues, previousContent }) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const previousContentSection = previousContent
      ? `Previous file content:\n${previousContent}`
      : "No previous version available.";

    const ruleIssuesSection =
      ruleIssues.length > 0
        ? `Rule violations found:\n${ruleIssues.join("\n")}`
        : "No rule violations found.";

    const prompt = `
You are a senior software engineer performing a code review on a pull request.

Analyze the following PR and respond ONLY in this exact JSON format with no extra text or markdown backticks:

{
  "summary": "One sentence describing what this PR does",
  "status": "good or bad",
  "issues": [
    {
      "type": "critical or warning or suggestion",
      "issue": "What is wrong",
      "why": "Why it is a problem",
      "fix": "How to fix it"
    }
  ],
  "improvements": ["optional improvement 1", "optional improvement 2"],
  "commitMessageFeedback": "Feedback on the commit message quality"
}

Rules:
- status is "bad" if there are any critical or warning issues, otherwise "good"
- issues array can be empty if code is clean
- improvements are optional enhancements even for good code
- Be specific, practical, and concise
- Detect issues beyond just rule violations:
  * Bad variable names
  * Missing error handling
  * Security vulnerabilities
  * Inefficient code
  * Poor structure

PR Details:
Commit message: "${message}"
${ruleIssuesSection}
${previousContentSection}

New code submitted:
${content}
    `;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // Strip markdown code fences if present
    const clean = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return {
      status: parsed.status || "good",
      summary: parsed.summary || "",
      issues: parsed.issues || [],
      improvements: parsed.improvements || [],
      commitMessageFeedback: parsed.commitMessageFeedback || ""
    };

  } catch (error) {
    console.error("AI Review failed:", error.message);

    // Fallback if AI fails
    return {
      status: ruleIssues.length > 0 ? "bad" : "good",
      summary: "AI review unavailable",
      issues: ruleIssues.map((issue) => ({
        type: "warning",
        issue,
        why: "Violates repository rule",
        fix: `Fix: ${issue}`
      })),
      improvements: [],
      commitMessageFeedback: ""
    };
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

  /* ---------- PREVENT SAME CONTENT AS LAST PR ---------- */
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

  /* ---------- AI REVIEW ---------- */
  const aiResult = await getAIReview({
    content,
    message,
    ruleIssues: issues,
    previousContent: file.content || null
  });

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

  await createNotification({
  recipient: repo.owner,
  sender: req.user._id,
  type: "pr_created",
  message: `${req.user.username} created a new PR on file ${file.name}`,
  repository: repo._id,
  pullRequest: pr._id
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
  }

  /* ---------- REJECT ---------- */
  if (action === "reject") {
    pr.status = "rejected";
  }

  pr.reviewedBy = req.user._id;
  pr.reviewedAt = new Date();
  await pr.save();

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