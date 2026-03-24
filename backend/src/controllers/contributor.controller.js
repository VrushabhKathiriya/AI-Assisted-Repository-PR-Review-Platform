import { Repository } from "../models/repository.model.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createNotification } from "../utils/createNotification.js";

/* ================= ADD CONTRIBUTOR ================= */
export const addContributor = asyncHandler(async (req, res) => {

  const { repoId } = req.params;
  const { username } = req.body;

  /* ---------- VALIDATION ---------- */
  if (!username || !username.trim()) {
    throw new ApiError(400, "Username is required");
  }

  /* ---------- FETCH REPO ---------- */
  const repository = await Repository.findById(repoId);
  if (!repository) {
    throw new ApiError(404, "Repository not found");
  }

  /* ---------- OWNER CHECK ---------- */
  if (repository.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only owner can add contributors");
  }

  /* ---------- FIND USER ---------- */
  const userToAdd = await User.findOne({ username: username.trim() });
  if (!userToAdd) {
    throw new ApiError(404, `User '${username}' not found`);
  }

  /* ---------- PREVENT ADDING OWNER ---------- */
  if (userToAdd._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, "Owner cannot be added as contributor");
  }

  /* ---------- PREVENT DUPLICATE ---------- */
  const alreadyContributor = repository.contributors.some(
    (c) => c.toString() === userToAdd._id.toString()
  );

  if (alreadyContributor) {
    throw new ApiError(409, `User '${username}' is already a contributor`);
  }

  /* ---------- ADD CONTRIBUTOR ---------- */
  repository.contributors.push(userToAdd._id);
  await repository.save();

  const updatedRepo = await Repository.findById(repoId)
    .populate("owner", "username email")
    .populate("contributors", "username email");

    await createNotification({
  recipient: userToAdd._id,
  sender: req.user._id,
  type: "contributor_added",
  message: `${req.user.username} added you as contributor to ${repository.name}`,
  repository: repository._id
});

  return res.status(200).json(
    new ApiResponse(
      200,
      updatedRepo,
      `'${username}' added as contributor successfully`
    )
  );
});

/* ================= REMOVE CONTRIBUTOR ================= */
export const removeContributor = asyncHandler(async (req, res) => {

  const { repoId, userId } = req.params;

  /* ---------- FETCH REPO ---------- */
  const repository = await Repository.findById(repoId);
  if (!repository) {
    throw new ApiError(404, "Repository not found");
  }

  /* ---------- OWNER CHECK ---------- */
  if (repository.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only owner can remove contributors");
  }

  /* ---------- CHECK IF CONTRIBUTOR EXISTS ---------- */
  const isContributor = repository.contributors.some(
    (c) => c.toString() === userId
  );

  if (!isContributor) {
    throw new ApiError(404, "User is not a contributor of this repository");
  }

  /* ---------- REMOVE CONTRIBUTOR ---------- */
  repository.contributors = repository.contributors.filter(
    (c) => c.toString() !== userId
  );

  await repository.save();

  const updatedRepo = await Repository.findById(repoId)
    .populate("owner", "username email")
    .populate("contributors", "username email");
  
  await createNotification({
  recipient: userId,
  sender: req.user._id,
  type: "contributor_removed",
  message: `You were removed from ${repository.name} by ${req.user.username}`,
  repository: repository._id
});

  return res.status(200).json(
    new ApiResponse(
      200,
      updatedRepo,
      "Contributor removed successfully"
    )
  );
});

/* ================= GET CONTRIBUTORS ================= */
export const getContributors = asyncHandler(async (req, res) => {

  const { repoId } = req.params;

  /* ---------- FETCH REPO ---------- */
  const repository = await Repository.findById(repoId)
    .populate("owner", "username email")
    .populate("contributors", "username email");

  if (!repository) {
    throw new ApiError(404, "Repository not found");
  }

  /* ---------- ACCESS CHECK ---------- */
  const isOwner = repository.owner._id.toString() === req.user._id.toString();
  const isContributor = repository.contributors.some(
    (c) => c._id.toString() === req.user._id.toString()
  );
  const isPublic = repository.visibility === "public";

  if (!isOwner && !isContributor && !isPublic) {
    throw new ApiError(403, "You do not have access to this repository");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        owner: repository.owner,
        contributors: repository.contributors,
        total: repository.contributors.length
      },
      "Contributors fetched successfully"
    )
  );
});