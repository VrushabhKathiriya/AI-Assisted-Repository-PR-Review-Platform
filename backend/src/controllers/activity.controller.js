import { Activity } from "../models/activity.model.js";
import { Repository } from "../models/repository.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

/* ================= GET REPO ACTIVITY ================= */
export const getRepoActivity = asyncHandler(async (req, res) => {

  const { repoId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  /* ---------- FETCH REPO ---------- */
  const repo = await Repository.findById(repoId);
  if (!repo) throw new ApiError(404, "Repository not found");

  /* ---------- ACCESS CHECK ---------- */
  const isOwner = repo.owner.toString() === req.user._id.toString();
  const isContributor = repo.contributors.some(
    (c) => c.toString() === req.user._id.toString()
  );
  const isPublic = repo.visibility === "public";

  if (!isOwner && !isContributor && !isPublic) {
    throw new ApiError(403, "Access denied");
  }

  const skip = (Number(page) - 1) * Number(limit);

  const activities = await Activity.find({ repository: repoId })
    .populate("performedBy", "username email")
    .populate("file", "name")
    .populate("pullRequest", "message status")
    .populate("targetUser", "username email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Activity.countDocuments({ repository: repoId });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        activities,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
      },
      "Repository activity fetched successfully"
    )
  );
});

/* ================= GET MY ACTIVITY ================= */
export const getMyActivity = asyncHandler(async (req, res) => {

  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const activities = await Activity.find({
    performedBy: req.user._id
  })
    .populate("repository", "name")
    .populate("file", "name")
    .populate("pullRequest", "message status")
    .populate("targetUser", "username email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Activity.countDocuments({
    performedBy: req.user._id
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        activities,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
      },
      "Your activity fetched successfully"
    )
  );
});