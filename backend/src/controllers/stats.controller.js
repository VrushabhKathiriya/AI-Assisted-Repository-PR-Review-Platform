import { Repository } from "../models/repository.model.js";
import { PullRequest } from "../models/pullRequest.model.js";
import { File } from "../models/file.model.js";
import { Comment } from "../models/comment.model.js";
import { Notification } from "../models/notification.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

/* ================= REPO STATS ================= */
export const getRepoStats = asyncHandler(async (req, res) => {

  const { repoId } = req.params;

  /* ---------- FETCH REPO ---------- */
  const repo = await Repository.findById(repoId);
  if (!repo) throw new ApiError(404, "Repository not found");

  /* ---------- ACCESS CHECK ---------- */
  const isOwner = repo.owner.toString() === req.user._id.toString();
  const isContributor = repo.contributors.some(
    (c) => c.toString() === req.user._id.toString()
  );

  if (!isOwner && !isContributor) {
    throw new ApiError(403, "Access denied");
  }

  /* ---------- PR STATS ---------- */
  const prStats = await PullRequest.aggregate([
    { $match: { repository: repo._id } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);

  /* Convert array to object */
  const prCounts = {
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0
  };

  prStats.forEach(({ _id, count }) => {
    prCounts[_id] = count;
    prCounts.total += count;
  });

  /* ---------- RULE VIOLATION STATS ---------- */
  const ruleViolations = await PullRequest.aggregate([
    { $match: { repository: repo._id } },
    { $unwind: "$ruleResult.issues" },
    {
      $group: {
        _id: "$ruleResult.issues",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  /* ---------- AI REVIEW STATS ---------- */
  const aiStats = await PullRequest.aggregate([
    { $match: { repository: repo._id } },
    {
      $group: {
        _id: "$aiResult.status",
        count: { $sum: 1 }
      }
    }
  ]);

  const aiCounts = { good: 0, bad: 0 };
  aiStats.forEach(({ _id, count }) => {
    aiCounts[_id] = count;
  });

  /* ---------- MOST ACTIVE CONTRIBUTORS ---------- */
  const activeContributors = await PullRequest.aggregate([
    { $match: { repository: repo._id } },
    {
      $group: {
        _id: "$createdBy",
        prCount: { $sum: 1 },
        acceptedCount: {
          $sum: {
            $cond: [{ $eq: ["$status", "accepted"] }, 1, 0]
          }
        }
      }
    },
    { $sort: { prCount: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    {
      $project: {
        username: "$user.username",
        email: "$user.email",
        prCount: 1,
        acceptedCount: 1
      }
    }
  ]);

  /* ---------- FILE STATS ---------- */
  const fileStats = await File.aggregate([
    { $match: { repository: repo._id } },
    {
      $project: {
        name: 1,
        versionsCount: { $size: "$versions" }
      }
    },
    { $sort: { versionsCount: -1 } }
  ]);

  /* ---------- COMMENT STATS ---------- */
  const totalComments = await Comment.countDocuments({
    repository: repoId
  });

  /* ---------- RECENT ACTIVITY ---------- */
  const recentPRs = await PullRequest.find({ repository: repoId })
    .populate("createdBy", "username")
    .populate("file", "name")
    .sort({ createdAt: -1 })
    .limit(5)
    .select("message status createdAt createdBy file");

  /* ---------- PR ACCEPTANCE RATE ---------- */
  const acceptanceRate =
    prCounts.total > 0
      ? ((prCounts.accepted / prCounts.total) * 100).toFixed(1)
      : 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        repository: {
          name: repo.name,
          visibility: repo.visibility,
          totalContributors: repo.contributors.length,
          totalRules: Object.keys(repo.rules || {}).length
        },
        pullRequests: {
          ...prCounts,
          acceptanceRate: `${acceptanceRate}%`
        },
        aiReview: {
          ...aiCounts,
          totalReviewed: aiCounts.good + aiCounts.bad
        },
        topRuleViolations: ruleViolations.map(({ _id, count }) => ({
          rule: _id,
          violations: count
        })),
        mostActiveContributors: activeContributors,
        files: {
          total: fileStats.length,
          mostUpdated: fileStats.slice(0, 3)
        },
        totalComments,
        recentActivity: recentPRs
      },
      "Repository stats fetched successfully"
    )
  );
});

/* ================= USER STATS ================= */
export const getUserStats = asyncHandler(async (req, res) => {

  const userId = req.user._id;

  /* ---------- REPOS OWNED ---------- */
  const reposOwned = await Repository.countDocuments({ owner: userId });

  /* ---------- REPOS CONTRIBUTED ---------- */
  const reposContributed = await Repository.countDocuments({
    contributors: userId
  });

  /* ---------- PR STATS ---------- */
  const prStats = await PullRequest.aggregate([
    { $match: { createdBy: userId } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);

  const prCounts = {
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0
  };

  prStats.forEach(({ _id, count }) => {
    prCounts[_id] = count;
    prCounts.total += count;
  });

  /* ---------- ACCEPTANCE RATE ---------- */
  const acceptanceRate =
    prCounts.total > 0
      ? ((prCounts.accepted / prCounts.total) * 100).toFixed(1)
      : 0;

  /* ---------- COMMENTS MADE ---------- */
  const totalComments = await Comment.countDocuments({ author: userId });

  /* ---------- RULE VIOLATIONS IN MY PRs ---------- */
  const myRuleViolations = await PullRequest.aggregate([
    { $match: { createdBy: userId } },
    { $unwind: "$ruleResult.issues" },
    {
      $group: {
        _id: "$ruleResult.issues",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 3 }
  ]);

  /* ---------- REPOS I AM ACTIVE IN ---------- */
  const activeRepos = await PullRequest.aggregate([
    { $match: { createdBy: userId } },
    {
      $group: {
        _id: "$repository",
        prCount: { $sum: 1 }
      }
    },
    { $sort: { prCount: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "repositories",
        localField: "_id",
        foreignField: "_id",
        as: "repo"
      }
    },
    { $unwind: "$repo" },
    {
      $project: {
        repoName: "$repo.name",
        prCount: 1
      }
    }
  ]);

  /* ---------- RECENT PRs ---------- */
  const recentPRs = await PullRequest.find({ createdBy: userId })
    .populate("repository", "name")
    .populate("file", "name")
    .sort({ createdAt: -1 })
    .limit(5)
    .select("message status createdAt repository file");

  /* ---------- NOTIFICATIONS UNREAD ---------- */
  const unreadNotifications = await Notification.countDocuments({
    recipient: userId,
    isRead: false
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        overview: {
          reposOwned,
          reposContributed,
          totalRepos: reposOwned + reposContributed,
          totalComments,
          unreadNotifications
        },
        pullRequests: {
          ...prCounts,
          acceptanceRate: `${acceptanceRate}%`
        },
        myTopRuleViolations: myRuleViolations.map(({ _id, count }) => ({
          rule: _id,
          violations: count
        })),
        mostActiveIn: activeRepos,
        recentActivity: recentPRs
      },
      "User stats fetched successfully"
    )
  );
});