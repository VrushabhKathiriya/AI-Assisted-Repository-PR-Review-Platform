import { File } from "../models/file.model.js";
import { Repository } from "../models/repository.model.js";
import { PullRequest } from "../models/pullRequest.model.js";
import { createActivity } from "../utils/createActivity.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";


/* ================= CREATE FILE ================= */

export const createFile = asyncHandler(async (req, res) => {
  const { repoId } = req.params;
  const { name, content, message } = req.body;

  if (!name || !content || !message) {
    throw new ApiError(400, "Name, content and message are required");
  }

  if (message.length > 100) {
    throw new ApiError(400, "Commit message cannot exceed 100 characters");
  }

  const repository = await Repository.findById(repoId);
  if (!repository) throw new ApiError(404, "Repository not found");

  const isOwner = repository.owner.toString() === req.user._id.toString();
  const isContributor = repository.contributors.some(
    (c) => c.toString() === req.user._id.toString()
  );

  if (!isOwner && !isContributor) {
    throw new ApiError(403, "Not allowed");
  }

  const existingFile = await File.findOne({ name, repository: repoId });
  if (existingFile) {
    throw new ApiError(409, "File already exists");
  }

  const file = await File.create({
    name,
    repository: repoId,
    createdBy: req.user._id,
    content: content,           
    versions: [
      {
        content,
        message,
        updatedBy: req.user._id
      }
    ]
  });

  await createActivity({
  repository: repoId,
  performedBy: req.user._id,
  type: "file_created",
  message: `${req.user.username} created file ${name}`,
  file: file._id
});

  return res.status(201).json(
    new ApiResponse(201, file, "File created with initial commit")
  );
});

/* ================= GET ALL FILES IN REPO ================= */
export const getFilesByRepository = asyncHandler(async (req, res) => {
  const { repoId } = req.params;

  const repository = await Repository.findById(repoId);
  if (!repository) {
    throw new ApiError(404, "Repository not found");
  }

  const isOwner = repository.owner.toString() === req.user._id.toString();
  const isContributor = repository.contributors.some(
    (c) => c.toString() === req.user._id.toString()
  );
  const isPublic = repository.visibility === "public";

  if (!isOwner && !isContributor && !isPublic) {
    throw new ApiError(403, "Access denied");
  }

  const files = await File.find({ repository: repoId });

  const response = files.map((file) => ({
    _id: file._id,
    name: file.name,
    size: file.size,
    content: file.content,        
    versionsCount: file.versions.length,
    createdBy: file.createdBy,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, response, "Files fetched successfully"));
});


/* ================= GET SINGLE FILE ================= */

export const getFileById = asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  const file = await File.findById(fileId)
    .populate("versions.updatedBy", "username email");

  if (!file) throw new ApiError(404, "File not found");

  const latestVersion = file.versions[file.versions.length - 1];

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        _id: file._id,
        name: file.name,
        repository: file.repository,
        content: file.content,       
        size: file.size,
        versions: file.versions,
        versionsCount: file.versions.length,
        createdBy: file.createdBy,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt
      },
      "File fetched successfully"
    )
  );
});

/* ================= UPDATE FILE ================= */

export const updateFile = asyncHandler(async (req, res) => {
  const { fileId } = req.params;
  const { content, message } = req.body;

  if (!content || !message) {
    throw new ApiError(400, "Content and message required");
  }

  if (message.length > 100) {
    throw new ApiError(400, "Message too long");
  }

  const file = await File.findById(fileId);
  if (!file) throw new ApiError(404, "File not found");

  const repository = await Repository.findById(file.repository);

  if (!repository) throw new ApiError(404, "Repository not found");

  const isOwner = repository.owner.toString() === req.user._id.toString();
  const isContributor = repository.contributors.some(
    (c) => c.toString() === req.user._id.toString()
  );

  if (!isOwner && !isContributor) {
    throw new ApiError(403, "Not allowed");
  }

  /* ---------- ADD NEW VERSION ---------- */
  file.content = content;           
  file.versions.push({
    content,
    message,
    updatedBy: req.user._id
  });

  await createActivity({
  repository: file.repository,
  performedBy: req.user._id,
  type: "file_updated",
  message: `${req.user.username} committed a new version to file ${file.name}`,
  file: file._id
  });

  await file.save();

  return res.status(200).json(
    new ApiResponse(200, file, "New version committed")
  );
});

/* ================= DELETE FILE ================= */
export const deleteFile = asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  const file = await File.findById(fileId);
  if (!file) {
    throw new ApiError(404, "File not found");
  }

  const repository = await Repository.findById(file.repository);

  if (!repository) throw new ApiError(404, "Repository not found");

  const isOwner = repository.owner.toString() === req.user._id.toString();

  if (!isOwner) {
    throw new ApiError(403, "Only owner can delete file");
  }
  await createActivity({
  repository: file.repository,
  performedBy: req.user._id,
  type: "file_deleted",
  message: `${req.user.username} deleted file ${file.name}`
  });

  await PullRequest.deleteMany({ file: fileId });
  await File.findByIdAndDelete(fileId)

  

  return res
    .status(200)
    .json(new ApiResponse(200, null, "File deleted successfully"));
});