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

    const ruleIssuesSection =
      ruleIssues.length > 0
        ? `Rule violations found:\n${ruleIssues.join("\n")}`
        : "No rule violations found.";

    const previousContentSection = previousContent
      ? `Previous Code:\n${previousContent}`
      : "No previous version available. This is the first version of the file.";

    const prompt = `
You are a senior software engineer reviewing a pull request.

Your job is to COMPARE the previous code and the new code and evaluate whether the changes are valid, safe, and meaningful.

IMPORTANT INSTRUCTIONS:
- Do NOT review the new code in isolation
- Your summary MUST describe WHAT CHANGED between them.
- You MUST compare it with the previous code
- Do NOT describe the new code as "initial implementation" if previous code exists.
- Identify if functionality is removed, broken, or unrelated
- Detect regressions (loss of logic, simplification, or invalid replacement)
- If no previous code exists, review the new code on its own merit
- Focus on differences: additions, removals, improvements, or regressions.

Respond ONLY in this exact JSON format with no extra text or markdown backticks:

{
  "summary": "What changed from previous to new code in one sentence so Describe EXACTLY what changed from previous code to new code",
  "status": "good or bad",
  "issues": [
    {
      "type": "critical or warning or suggestion",
      "issue": "What is wrong in terms of the change",
      "why": "Why this change is problematic compared to previous code",
      "fix": "How to fix it"
    }
  ],
  "improvements": ["optional improvement 1", "optional improvement 2"],
  "commitMessageFeedback": "Feedback on the commit message quality"
}

Status Rules:
- status is "bad" ONLY if there are critical issues
- status is "good" if there are only warnings or suggestions
- If new code removes important logic → critical issue → status "bad"
- If new code is completely unrelated to previous → critical issue → status "bad"
- If new code improves existing logic → status "good"
- If new code is valid but has minor issues → status "good" with warnings

Code Quality Rules:
- Detect bad variable names
- Detect missing error handling
- Detect security vulnerabilities
- Detect inefficient code
- Detect poor structure

STRICT INSTRUCTION:
- Output ONLY valid JSON
- Do NOT include any explanation or text before or after JSON
- Do NOT use markdown

PR Details:
Commit Message: "${message}"
${ruleIssuesSection}

${previousContentSection}

New Code:
${content}
    `;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("No valid JSON found in AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    console.log("RAW AI RESPONSE:", rawText);

    /* ---------- STATUS BASED ON CRITICAL ISSUES ONLY ---------- */
    const hasCriticalIssues = (parsed.issues || []).some(
      (issue) => issue.type === "critical"
    );

    return {
      status: hasCriticalIssues ? "bad" : "good",
      summary: parsed.summary || "",
      issues: parsed.issues || [],
      improvements: parsed.improvements || [],
      commitMessageFeedback: parsed.commitMessageFeedback || ""
    };

  } catch (error) {
    console.error("AI Review failed:", error.message);

    const hasCriticalRuleIssues = ruleIssues.length > 0;

    return {
      status: hasCriticalRuleIssues ? "bad" : "good",
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

  if (message.length > 100) {
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

  /* ---------- NOTIFY REPO OWNER ---------- */
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
