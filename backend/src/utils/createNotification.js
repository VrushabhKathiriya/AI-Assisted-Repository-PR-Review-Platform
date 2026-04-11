import { Notification } from "../models/notification.model.js";

export const createNotification = async ({
  recipient,
  sender,
  type,
  message,
  repository = null,
  pullRequest = null,
  comment = null,
  invitationToken = null
}) => {
  try {
    /* Don't notify yourself */
    if (recipient.toString() === sender.toString()) return;

    await Notification.create({
      recipient,
      sender,
      type,
      message,
      repository,
      pullRequest,
      comment,
      invitationToken
    });
  } catch (error) {
    /* Notification failure should never break main flow */
    console.error("Notification creation failed:", error.message);
  }
};