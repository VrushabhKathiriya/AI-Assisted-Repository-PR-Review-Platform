import { Repository } from "../models/repository.model.js";
import { File } from "../models/file.model.js";
import { User } from "../models/user.model.js";
import { PullRequest } from "../models/pullRequest.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

/* ================= SEARCH REPOSITORIES ================= */
export const searchRepositories = asyncHandler(async (req, res) => {

  const { q } = req.query;

  if (!q || !q.trim()) {
    throw new ApiError(400, "Search query is required");
  }

  const repos = await Repository.find({
    $and: [
      {
        $or: [
          { name: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } }
        ]
      },
      {
        $or: [
          { visibility: "public" },
          { owner: req.user._id },
          { contributors: req.user._id }
        ]
      }
    ]
  })
    .populate("owner", "username email")
    .select("name description visibility owner contributors createdAt")
    .limit(20);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        results: repos,
        total: repos.length,
        query: q
      },
      "Repositories fetched successfully"
    )
  );
});

/* ================= SEARCH USERS ================= */
export const searchUsers = asyncHandler(async (req, res) => {

  const { q } = req.query;

  if (!q || !q.trim()) {
    throw new ApiError(400, "Search query is required");
  }

  const users = await User.find({
    $and: [
      { isVerified: true },
      {
        $or: [
          { username: { $regex: q, $options: "i" } },
          { fullName: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } }
        ]
      }
    ]
  })
    .select("username fullName email createdAt")
    .limit(20);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        results: users,
        total: users.length,
        query: q
      },
      "Users fetched successfully"
    )
  );
});

/* ================= SEARCH FILES ================= */
export const searchFiles = asyncHandler(async (req, res) => {

  const { q, repoId } = req.query;

  if (!q || !q.trim()) {
    throw new ApiError(400, "Search query is required");
  }

  /* ---------- BUILD QUERY ---------- */
  const query = {
    name: { $regex: q, $options: "i" }
  };

  /* If repoId provided search within that repo only */
  if (repoId) {
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

    query.repository = repoId;
  }

  const files = await File.find(query)
    .populate("repository", "name visibility")
    .populate("createdBy", "username")
    .select("name content size createdAt repository createdBy")
    .limit(20);

  /* Filter out files from private repos user has no access to */
  const accessibleFiles = files.filter((file) => {
    const repo = file.repository;
    if (!repo) return false;
    if (repo.visibility === "public") return true;
    if (repo.owner?.toString() === req.user._id.toString()) return true;
    if (repo.contributors?.some(
      (c) => c.toString() === req.user._id.toString()
    )) return true;
    return false;
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        results: accessibleFiles,
        total: accessibleFiles.length,
        query: q
      },
      "Files fetched successfully"
    )
  );
});

/* ================= SEARCH PULL REQUESTS ================= */
export const searchPullRequests = asyncHandler(async (req, res) => {

  const { q, repoId, status } = req.query;

  
  if (!q?.trim() && !status) {
    throw new ApiError(
      400,
      "Provide at least a search query or status filter"
    );
  }

  
  const query = {};

  
  if (q && q.trim()) {
    query.message = { $regex: q, $options: "i" };
  }

  if (repoId) query.repository = repoId;

  if (status && ["pending", "accepted", "rejected"].includes(status)) {
    query.status = status;
  }

  const prs = await PullRequest.find(query)
    .populate("createdBy", "username email")
    .populate("file", "name")
    .populate("repository", "name visibility owner contributors")
    .sort({ createdAt: -1 })
    .limit(20);

  /* Filter out PRs from private repos user has no access to */
  const accessiblePRs = prs.filter((pr) => {
    const repo = pr.repository;
    if (!repo) return false;
    if (repo.visibility === "public") return true;
    if (repo.owner?.toString() === req.user._id.toString()) return true;
    if (repo.contributors?.some(
      (c) => c.toString() === req.user._id.toString()
    )) return true;
    return false;
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        results: accessiblePRs,
        total: accessiblePRs.length,
        query: q || null,
        status: status || null
      },
      "Pull requests fetched successfully"
    )
  );
});

/* ================= SEARCH SUGGESTIONS (lightweight autocomplete) ================= */
export const searchSuggestions = asyncHandler(async (req, res) => {

  const { q } = req.query;

  /* Require at least 2 characters — avoids extremely broad queries */
  if (!q || q.trim().length < 2) {
    return res.status(200).json(
      new ApiResponse(200, { suggestions: [], query: q || "" }, "No suggestions")
    );
  }

  const trimmed = q.trim();

  /* Run all 4 searches in parallel — 3 results each, minimal fields */
  const [repos, users, files, prs] = await Promise.all([

    /* Repos — name match only, skip content-heavy description */
    Repository.find({
      $and: [
        { name: { $regex: trimmed, $options: "i" } },
        {
          $or: [
            { visibility: "public" },
            { owner: req.user._id },
            { contributors: req.user._id }
          ]
        }
      ]
    })
      .select("name visibility")
      .limit(3)
      .lean(),

    /* Users — username + fullName match */
    User.find({
      $and: [
        { isVerified: true },
        {
          $or: [
            { username: { $regex: trimmed, $options: "i" } },
            { fullName: { $regex: trimmed, $options: "i" } }
          ]
        }
      ]
    })
      .select("username fullName")
      .limit(3)
      .lean(),

    /* Files — name match only (no content search, very fast) */
    File.find({ name: { $regex: trimmed, $options: "i" } })
      .populate("repository", "name visibility owner contributors")
      .select("name repository")
      .limit(5) /* fetch 5 so we have room after access filtering */
      .lean(),

    /* PRs — message match */
    PullRequest.find({ message: { $regex: trimmed, $options: "i" } })
      .populate("repository", "name visibility owner contributors")
      .select("message status repository")
      .limit(5)
      .lean()
  ]);

  /* Filter files from repos the user can't access */
  const accessibleFiles = files
    .filter((file) => {
      const repo = file.repository;
      if (!repo) return false;
      if (repo.visibility === "public") return true;
      if (repo.owner?.toString() === req.user._id.toString()) return true;
      if (repo.contributors?.some(
        (c) => c.toString() === req.user._id.toString()
      )) return true;
      return false;
    })
    .slice(0, 3);

  /* Filter PRs from repos the user can't access */
  const accessiblePRs = prs
    .filter((pr) => {
      const repo = pr.repository;
      if (!repo) return false;
      if (repo.visibility === "public") return true;
      if (repo.owner?.toString() === req.user._id.toString()) return true;
      if (repo.contributors?.some(
        (c) => c.toString() === req.user._id.toString()
      )) return true;
      return false;
    })
    .slice(0, 3);

  /* Map to a uniform lightweight shape: { _id, label, sublabel, type } */
  const suggestions = [
    ...repos.map((r) => ({
      _id: r._id,
      label: r.name,
      sublabel: r.visibility,
      type: "repository"
    })),
    ...users.map((u) => ({
      _id: u._id,
      label: u.username,
      sublabel: u.fullName || "",
      type: "user"
    })),
    ...accessibleFiles.map((f) => ({
      _id: f._id,
      label: f.name,
      sublabel: f.repository?.name || "",
      type: "file"
    })),
    ...accessiblePRs.map((pr) => ({
      _id: pr._id,
      label: pr.message,
      sublabel: pr.repository?.name || "",
      type: "pullRequest"
    }))
  ];

  return res.status(200).json(
    new ApiResponse(
      200,
      { suggestions, query: trimmed, total: suggestions.length },
      "Suggestions fetched successfully"
    )
  );
});

/* ================= GLOBAL SEARCH ================= */
export const globalSearch = asyncHandler(async (req, res) => {

  const { q } = req.query;

  if (!q || !q.trim()) {
    throw new ApiError(400, "Search query is required");
  }

  /* Run all searches in parallel */
  const [repos, users, files, prs] = await Promise.all([

    /* Repos */
    Repository.find({
      $and: [
        {
          $or: [
            { name: { $regex: q, $options: "i" } },
            { description: { $regex: q, $options: "i" } }
          ]
        },
        {
          $or: [
            { visibility: "public" },
            { owner: req.user._id },
            { contributors: req.user._id }
          ]
        }
      ]
    })
      .populate("owner", "username")
      .select("name description visibility owner createdAt")
      .limit(5),

    /* Users */
    User.find({
      $and: [
        { isVerified: true },
        {
          $or: [
            { username: { $regex: q, $options: "i" } },
            { fullName: { $regex: q, $options: "i" } }
          ]
        }
      ]
    })
      .select("username fullName email createdAt")
      .limit(5),

    /* Files */
    File.find({ name: { $regex: q, $options: "i" } })
      .populate("repository", "name visibility owner contributors")
      .populate("createdBy", "username")
      .select("name size createdAt repository createdBy")
      .limit(5),

    /* PRs */
    PullRequest.find({
      message: { $regex: q, $options: "i" }
    })
      .populate("repository", "name visibility owner contributors")
      .populate("createdBy", "username")
      .populate("file", "name")
      .select("message status createdAt repository file createdBy")
      .limit(5)
  ]);

  /* Filter private repo files */
  const accessibleFiles = files.filter((file) => {
    const repo = file.repository;
    if (!repo) return false;
    if (repo.visibility === "public") return true;
    if (repo.owner?.toString() === req.user._id.toString()) return true;
    if (repo.contributors?.some(
    (c) => c.toString() === req.user._id.toString()
    )) return true;
    return false;
  });

  /* Filter private repo PRs */
  const accessiblePRs = prs.filter((pr) => {
    const repo = pr.repository;
    if (!repo) return false;
    if (repo.visibility === "public") return true;
    if (repo.owner?.toString() === req.user._id.toString()) return true;
    if (repo.contributors?.some(
    (c) => c.toString() === req.user._id.toString()
    )) return true;
    return false;
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        query: q,
        repositories: { results: repos, total: repos.length },
        users: { results: users, total: users.length },
        files: { results: accessibleFiles, total: accessibleFiles.length },
        pullRequests: { results: accessiblePRs, total: accessiblePRs.length }
      },
      "Search completed successfully"
    )
  );
});