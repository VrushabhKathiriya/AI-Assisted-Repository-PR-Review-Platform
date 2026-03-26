import { Activity } from "../models/activity.model.js";

export const createActivity = async ({
  repository,
  performedBy,
  type,
  message,
  file = null,
  pullRequest = null,
  comment = null,
  targetUser = null
}) => {
  try {
    await Activity.create({
      repository,
      performedBy,
      type,
      message,
      file,
      pullRequest,
      comment,
      targetUser
    });
  } catch (error) {
    /* Activity failure should never break main flow */
    console.error("Activity creation failed:", error.message);
  }
};