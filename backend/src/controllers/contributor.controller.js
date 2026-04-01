import { Repository } from "../models/repository.model.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createNotification } from "../utils/createNotification.js";
import { createActivity } from "../utils/createActivity.js";
import { sendInvitationEmail } from "../utils/email.js";
import { Invitation } from "../models/invitation.model.js";
import crypto from "crypto";
import { model } from "mongoose";

/* ================= INVITE CONTRIBUTOR BY USERNAME ================= */
export const inviteContributor = asyncHandler(async (req, res) => {

  const { repoId } = req.params;
  const { username } = req.body;

  /* ---------- VALIDATION ---------- */
  if (!username || !username.trim()) {
    throw new ApiError(400, "Username is required");
  }

  /* ---------- FETCH REPO ---------- */
  const repository = await Repository.findById(repoId);
  if (!repository) throw new ApiError(404, "Repository not found");

  /* ---------- OWNER CHECK ---------- */
  if (repository.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only owner can invite contributors");
  }

  /* ---------- FIND USER BY USERNAME ---------- */
  const userToInvite = await User.findOne({
    username: username.toLowerCase().trim(),
    $or: [{ isVerified: true }, { isPhoneVerified: true }]
  });

  if (!userToInvite) {
    throw new ApiError(404, `User '${username}' not found`);
  }

  /* ---------- PREVENT INVITING YOURSELF ---------- */
  if (userToInvite._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, "You cannot invite yourself");
  }

  /* ---------- PREVENT DUPLICATE CONTRIBUTOR ---------- */
  const alreadyContributor = repository.contributors.some(
    (c) => c.toString() === userToInvite._id.toString()
  );

  if (alreadyContributor) {
    throw new ApiError(409, `'${username}' is already a contributor`);
  }

  /* ---------- CHECK IF USER HAS EMAIL ---------- */
  if (!userToInvite.email) {
    throw new ApiError(
      400,
      `User '${username}' has not added an email to their profile. Ask them to add an email first before sending an invitation.`
    );
  }

  /* ---------- CHECK EXISTING PENDING INVITATION ---------- */
  const existingInvitation = await Invitation.findOne({
    repository: repoId,
    invitedUser: userToInvite._id,
    status: "pending"
  });

  if (existingInvitation) {
    throw new ApiError(
      409,
      `An invitation is already pending for '${username}'`
    );
  }

  /* ---------- GENERATE TOKEN ---------- */
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  /* ---------- CREATE INVITATION ---------- */
  await Invitation.create({
    repository: repoId,
    invitedBy: req.user._id,
    invitedUser: userToInvite._id,
    email: userToInvite.email,
    token: hashedToken,
    expiresAt
  });

  /* ---------- SEND EMAIL ---------- */
  const acceptLink = `${process.env.FRONTEND_URL}/invitation/accept/${rawToken}`;
  const declineLink = `${process.env.FRONTEND_URL}/invitation/decline/${rawToken}`;

  try {
    await sendInvitationEmail(
      userToInvite.email,
      req.user.username,
      repository.name,
      acceptLink,
      declineLink
    );
  } catch (error) {
    await Invitation.deleteOne({ token: hashedToken });
    throw new ApiError(500, "Failed to send invitation email. Please try again.");
  }

  /* ---------- IN-APP NOTIFICATION ---------- */
  await createNotification({
    recipient: userToInvite._id,
    sender: req.user._id,
    type: "contributor_added",
    message: `${req.user.username} invited you to collaborate on ${repository.name}`,
    repository: repository._id
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      `Invitation sent to '${username}' at ${userToInvite.email} successfully`
    )
  );
});

/* ================= ACCEPT INVITATION ================= */
export const acceptInvitation = asyncHandler(async (req, res) => {

  const { token } = req.params;

  /* ---------- HASH TOKEN ---------- */
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  /* ---------- FIND INVITATION ---------- */
  const invitation = await Invitation.findOne({
    token: hashedToken,
    status: "pending"
  });

  if (!invitation) {
    throw new ApiError(404, "Invitation not found or already used");
  }

  /* ---------- CHECK EXPIRY ---------- */
  if (invitation.expiresAt < new Date()) {
    invitation.status = "expired";
    await invitation.save();
    throw new ApiError(
      400,
      "Invitation has expired. Ask the owner to send a new one."
    );
  }

  /* ---------- CHECK IF LOGGED IN USER IS THE INVITED USER ---------- */
  if (invitation.invitedUser.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "This invitation was not sent to you"
    );
  }

  /* ---------- FETCH REPO ---------- */
  const repository = await Repository.findById(invitation.repository);
  if (!repository) throw new ApiError(404, "Repository not found");

  /* ---------- CHECK IF ALREADY CONTRIBUTOR ---------- */
  const alreadyContributor = repository.contributors.some(
    (c) => c.toString() === req.user._id.toString()
  );

  if (alreadyContributor) {
    invitation.status = "accepted";
    await invitation.save();
    throw new ApiError(409, "You are already a contributor of this repository");
  }

  /* ---------- ADD AS CONTRIBUTOR ---------- */
  repository.contributors.push(req.user._id);
  await repository.save();

  /* ---------- UPDATE INVITATION STATUS ---------- */
  invitation.status = "accepted";
  await invitation.save();

  /* ---------- ACTIVITY ---------- */
  await createActivity({
    repository: repository._id,
    performedBy: req.user._id,
    type: "contributor_added",
    message: `${req.user.username} accepted invitation and joined ${repository.name}`,
    targetUser: req.user._id
  });

  /* ---------- NOTIFY OWNER ---------- */
  await createNotification({
    recipient: repository.owner,
    sender: req.user._id,
    type: "contributor_added",
    message: `${req.user.username} accepted your invitation to ${repository.name}`,
    repository: repository._id
  });

  const updatedRepo = await Repository.findById(repository._id)
    .populate("owner", "username email")
    .populate("contributors", "username email");

  return res.status(200).json(
    new ApiResponse(
      200,
      updatedRepo,
      `You have successfully joined ${repository.name} as a contributor`
    )
  );
});

/* ================= DECLINE INVITATION ================= */
export const declineInvitation = asyncHandler(async (req, res) => {

  const { token } = req.params;

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const invitation = await Invitation.findOne({
    token: hashedToken,
    status: "pending"
  });

  if (!invitation) {
    throw new ApiError(404, "Invitation not found or already used");
  }

  /* ---------- CHECK IF LOGGED IN USER IS THE INVITED USER ---------- */
  if (invitation.invitedUser.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "This invitation was not sent to you");
  }

  /* ---------- CHECK EXPIRY ---------- */
  if (invitation.expiresAt < new Date()) {
    invitation.status = "expired";
    await invitation.save();
    throw new ApiError(400, "Invitation has already expired");
  }

  invitation.status = "declined";
  await invitation.save();

  /* ---------- NOTIFY OWNER ---------- */
  const repository = await Repository.findById(invitation.repository);

  await createNotification({
    recipient: invitation.invitedBy,
    sender: req.user._id,
    type: "contributor_removed",
    message: `${req.user.username} declined your invitation to ${repository?.name}`,
    repository: invitation.repository
  });

  return res.status(200).json(
    new ApiResponse(200, null, "Invitation declined successfully")
  );
});

/* ================= GET PENDING INVITATIONS (owner view) ================= */
export const getPendingInvitations = asyncHandler(async (req, res) => {

  const { repoId } = req.params;

  const repository = await Repository.findById(repoId);
  if (!repository) throw new ApiError(404, "Repository not found");

  if (repository.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only owner can view invitations");
  }

  const invitations = await Invitation.find({
    repository: repoId,
    status: "pending"
  })
    .populate("invitedUser", "username email")
    .populate("invitedBy", "username email")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        invitations,
        total: invitations.length
      },
      "Pending invitations fetched successfully"
    )
  );
});

/* ================= CANCEL INVITATION ================= */
export const cancelInvitation = asyncHandler(async (req, res) => {

  const { invitationId } = req.params;

  const invitation = await Invitation.findById(invitationId);
  if (!invitation) throw new ApiError(404, "Invitation not found");

  const repository = await Repository.findById(invitation.repository);
  if (!repository) throw new ApiError(404, "Repository not found");

  if (repository.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only owner can cancel invitations");
  }

  if (invitation.status !== "pending") {
    throw new ApiError(400, "Can only cancel pending invitations");
  }

  await invitation.deleteOne();

  return res.status(200).json(
    new ApiResponse(200, null, "Invitation cancelled successfully")
  );
});

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
  const userToAdd = await User.findOne({
    username: username.toLowerCase().trim(),
    $or: [{ isVerified: true }, { isPhoneVerified: true }]
  });

  if (!userToAdd) throw new ApiError(404, `User '${username}' not found`);

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

    await createActivity({
      repository: repoId,
      performedBy: req.user._id,
      type: "contributor_added",
      message: `${req.user.username} added ${userToAdd.username} as contributor`,
      targetUser: userToAdd._id
    });

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

    await createActivity({
      repository: repoId,
      performedBy: req.user._id,
      type: "contributor_removed",
      message: `${req.user.username} removed a contributor from the repository`,
      targetUser: userId
    });
  
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