import { Comment } from "../models/comment.model.js";
import { PullRequest } from "../models/pullRequest.model.js";
import { Repository } from "../models/repository.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createNotification } from "../utils/createNotification.js";
import { createActivity } from "../utils/createActivity.js";

/* ================= ADD COMMENT ================= */
export const addComment = asyncHandler(async (req, res) => {

  const { prId } = req.params;
  const { content } = req.body;

  /* ---------- VALIDATION ---------- */
  if (!content || !content.trim()) {
    throw new ApiError(400, "Comment content is required");
  }

  if (content.trim().length > 1000) {
    throw new ApiError(400, "Comment cannot exceed 1000 characters");
  }

  /* ---------- FETCH PR ---------- */
  const pr = await PullRequest.findById(prId);
  if (!pr) {
    throw new ApiError(404, "Pull request not found");
  }

  /* ---------- FETCH REPO ---------- */
  const repository = await Repository.findById(pr.repository);
  if (!repository) {
    throw new ApiError(404, "Repository not found");
  }

  /* ---------- ACCESS CHECK ---------- */
  const isOwner = repository.owner.toString() === req.user._id.toString();
  const isContributor = repository.contributors.some(
    (c) => c.toString() === req.user._id.toString()
  );

  if (!isOwner && !isContributor) {
    throw new ApiError(
      403,
      "Only repository owner and contributors can comment on PRs"
    );
  }

  /* ---------- CREATE COMMENT ---------- */
  const comment = await Comment.create({
    pullRequest: prId,
    repository: pr.repository,
    author: req.user._id,
    content: content.trim()
  });

  const populatedComment = await Comment.findById(comment._id)
    .populate("author", "username email");

  /* ---------- ACTIVITY ---------- */
  await createActivity({
    repository: pr.repository,
    performedBy: req.user._id,
    type: "comment_added",
    message: `${req.user.username} commented on a PR`,
    pullRequest: prId,
    comment: comment._id
  });

  /* ---------- NOTIFICATION ---------- */
  await createNotification({
    recipient: pr.createdBy,
    sender: req.user._id,
    type: "comment_added",
    message: `${req.user.username} commented on your PR`,
    repository: pr.repository,
    pullRequest: pr._id,
    comment: comment._id
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      populatedComment,
      "Comment added successfully"
    )
  );
});

/* ================= GET COMMENTS ================= */
export const getComments = asyncHandler(async (req, res) => {

  const { prId } = req.params;

  /* ---------- FETCH PR ---------- */
  const pr = await PullRequest.findById(prId);
  if (!pr) {
    throw new ApiError(404, "Pull request not found");
  }

  /* ---------- FETCH REPO ---------- */
  const repository = await Repository.findById(pr.repository);
  if (!repository) {
    throw new ApiError(404, "Repository not found");
  }

  /* ---------- ACCESS CHECK ---------- */
  
  const isOwner = repository.owner.toString() === req.user._id.toString();
  const isContributor = repository.contributors.some(
    (c) => c.toString() === req.user._id.toString()
  );
  const isPublic = repository.visibility === "public";

  if (!isOwner && !isContributor && !isPublic) {
    throw new ApiError(403, "You do not have access to this PR");
  }

  /* ---------- FETCH COMMENTS ---------- */
  const comments = await Comment.find({ pullRequest: prId })
    .populate("author", "username email")
    .sort({ createdAt: 1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        comments,
        total: comments.length
      },
      "Comments fetched successfully"
    )
  );
});

/* ================= EDIT COMMENT ================= */
export const editComment = asyncHandler(async (req, res) => {

  const { commentId } = req.params;
  const { content } = req.body;

  /* ---------- VALIDATION ---------- */
  if (!content || !content.trim()) {
    throw new ApiError(400, "Comment content is required");
  }

  if (content.trim().length > 1000) {
    throw new ApiError(400, "Comment cannot exceed 1000 characters");
  }

  /* ---------- FETCH COMMENT ---------- */
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  /* ---------- AUTHOR CHECK ---------- */
  if (comment.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only edit your own comments");
  }

  /* ---------- UPDATE COMMENT ---------- */
  comment.content = content.trim();
  comment.isEdited = true;
  await comment.save();

  const updatedComment = await Comment.findById(commentId)
    .populate("author", "username email");

  return res.status(200).json(
    new ApiResponse(
      200,
      updatedComment,
      "Comment updated successfully"
    )
  );
});

/* ================= DELETE COMMENT ================= */
export const deleteComment = asyncHandler(async (req, res) => {

  const { commentId } = req.params;

  /* ---------- FETCH COMMENT ---------- */
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  /* ---------- FETCH REPO ---------- */
  const repository = await Repository.findById(comment.repository);
  if (!repository) {
    throw new ApiError(404, "Repository not found");
  }

  /* ---------- PERMISSION CHECK ---------- */
  const isCommentAuthor =
    comment.author.toString() === req.user._id.toString();
  const isRepoOwner =
    repository.owner.toString() === req.user._id.toString();

  if (!isCommentAuthor && !isRepoOwner) {
    throw new ApiError(403, "You can only delete your own comments");
  }

  await comment.deleteOne();

  return res.status(200).json(
    new ApiResponse(200, null, "Comment deleted successfully")
  );
});