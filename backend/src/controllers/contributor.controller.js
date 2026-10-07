import { Repository } from "../models/repository.model.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createNotification } from "../utils/createNotification.js";
import { createActivity } from "../utils/createActivity.js";
import { sendInvitationEmail } from "../utils/email.js";
import { Invitation } from "../models/invitation.model.js";
import { Notification } from "../models/notification.model.js";
import crypto from "crypto";
import mongoose from "mongoose";
// KAFKA OUTBOX
import { Outbox } from "../kafka/outbox/outbox.model.js";         
import { TOPICS, EVENTS } from "../kafka/topics.js";              

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

  /* ---------- FIND INVITATION (pending OR already accepted) ---------- */
  const invitation = await Invitation.findOne({ token: hashedToken });

  if (!invitation) {
    throw new ApiError(404, "Invitation not found or already used");
  }

  /* ---------- IDEMPOTENCY: already accepted ---------- */
  if (invitation.status === "accepted") {
    const repo = await Repository.findById(invitation.repository)
      .populate("owner", "username email")
      .populate("contributors", "username email");
    return res.status(200).json(
      new ApiResponse(200, repo, "You have already joined this repository")
    );
  }

  /* ---------- CHECK STATUS ---------- */
  if (invitation.status !== "pending") {
    throw new ApiError(400, `This invitation has been ${invitation.status}`);
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
    const updatedRepo = await Repository.findById(repository._id)
      .populate("owner", "username email")
      .populate("contributors", "username email");
    return res.status(200).json(
      new ApiResponse(200, updatedRepo, "You are already a contributor of this repository")
    );
  }

  /* ---------- ADD AS CONTRIBUTOR ---------- */
  repository.contributors.push(req.user._id);
  
  /* ---------- UPDATE INVITATION STATUS ---------- */
  invitation.status = "accepted";

  
  const acceptSession = await mongoose.startSession();
  acceptSession.startTransaction();
  try {
    /* DB write 1: add contributor to repo */
    await repository.save({ session: acceptSession });
    /* DB write 2: mark invitation as accepted */
    await invitation.save({ session: acceptSession });
    /* DB write 3: clear invitation token from in-app notification */
    await Notification.updateMany(
      { recipient: req.user._id, invitationToken: token },
      { $set: { invitationToken: null, isRead: true } },
      { session: acceptSession }
    );
    /* DB write 4: Outbox event → notify repo owner */
    // OLD: await createNotification({ recipient: repository.owner, type: "contributor_added", ... });
    await Outbox.create(
      [
        {
          topic:     TOPICS.PR_LIFECYCLE_EVENTS,
          eventType: EVENTS.INVITATION_ACCEPTED,
          payload:   {
            repoOwnerId:          repository.owner.toString(),    // who gets notified
            acceptedByUserId:     req.user._id.toString(),
            acceptedByUsername:   req.user.username,
            repoId:               repository._id.toString(),
            repoName:             repository.name
          }
        }
      ],
      { session: acceptSession }
    );
    await acceptSession.commitTransaction();
  } catch (error) {
    await acceptSession.abortTransaction();
    throw error;
  } finally {
    acceptSession.endSession();
  }

  /* ---------- ACTIVITY (deduplicated) ---------- */
  const { Activity } = await import("../models/activity.model.js");
  const existingActivity = await Activity.findOne({
    repository: repository._id,
    performedBy: req.user._id,
    type: "contributor_added",
    targetUser: req.user._id,
    createdAt: { $gte: new Date(Date.now() - 60 * 1000) } // within last 60s
  });

  if (!existingActivity) {
    await createActivity({
      repository: repository._id,
      performedBy: req.user._id,
      type: "contributor_added",
      message: `${req.user.username} accepted invitation and joined ${repository.name}`,
      targetUser: req.user._id
    });
  }

  /* ---------- NOTIFY OWNER ---------- */
  // await createNotification({
  //   recipient: repository.owner,
  //   sender: req.user._id,
  //   type: "contributor_added",
  //   message: `${req.user.username} accepted your invitation to ${repository.name}`,
  //   repository: repository._id
  // });

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

  /* ---------- NOTIFY OWNER ---------- */
  const repository = await Repository.findById(invitation.repository);
  
  const declineSession = await mongoose.startSession();
  declineSession.startTransaction();
  try {
    /* DB write 1: mark invitation as declined */
    await invitation.save({ session: declineSession });
    /* DB write 2: clear invitation token from in-app notification */
    await Notification.updateMany(
      { recipient: req.user._id, invitationToken: token },
      { $set: { invitationToken: null, isRead: true } },
      { session: declineSession }
    );
    /* DB write 3: Outbox event → notify repo owner */
    //  OLD: await createNotification({ recipient: invitation.invitedBy, type: "contributor_removed", ... });
    await Outbox.create(
      [
        {
          topic:     TOPICS.PR_LIFECYCLE_EVENTS,
          eventType: EVENTS.INVITATION_DECLINED,
          payload:   {
            repoOwnerId:          invitation.invitedBy.toString(),  // who gets notified
            declinedByUserId:     req.user._id.toString(),
            declinedByUsername:   req.user.username,
            repoId:               invitation.repository.toString(),
            repoName:             repository?.name
          }
        }
      ],
      { session: declineSession }
    );
    await declineSession.commitTransaction();
  } catch (error) {
    await declineSession.abortTransaction();
    throw error;
  } finally {
    declineSession.endSession();
  }

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

  /* ---------- PREVENT DUPLICATE CONTRIBUTOR ---------- */
  const alreadyContributor = repository.contributors.some(
    (c) => c.toString() === userToAdd._id.toString()
  );

  if (alreadyContributor) {
    throw new ApiError(409, `User '${username}' is already a contributor`);
  }

  /* ---------- PREVENT DUPLICATE PENDING INVITATION ---------- */
  const existingInvitation = await Invitation.findOne({
    repository: repoId,
    invitedUser: userToAdd._id,
    status: "pending"
  });

  if (existingInvitation) {
    throw new ApiError(409, `An invitation is already pending for '${username}'`);
  }

  /* ---------- CREATE IN-APP INVITATION (no email required) ---------- */
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await Invitation.create({
    repository: repoId,
    invitedBy: req.user._id,
    invitedUser: userToAdd._id,
    token: hashedToken,
    source: "in_app",
    expiresAt
  });

  /* ---------- IN-APP NOTIFICATION (stores token for Accept/Decline) ---------- */
  await createNotification({
    recipient: userToAdd._id,
    sender: req.user._id,
    type: "contributor_added",
    message: `${req.user.username} invited you to join "${repository.name}" as a contributor`,
    repository: repository._id,
    invitationToken: rawToken
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      `Invitation sent to '${username}' — they will join once they accept in their notifications`
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