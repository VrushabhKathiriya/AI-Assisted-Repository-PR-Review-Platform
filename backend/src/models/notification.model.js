import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    /* ---------- WHO RECEIVES IT ---------- */
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    /* ---------- WHO TRIGGERED IT ---------- */
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    /* ---------- WHAT TYPE ---------- */
    type: {
      type: String,
      enum: [
        "pr_created",
        "pr_accepted",
        "pr_rejected",
        "comment_added",
        "contributor_added",
        "contributor_removed"
      ],
      required: true
    },

    /* ---------- HUMAN READABLE MESSAGE ---------- */
    message: {
      type: String,
      required: true
    },

    /* ---------- RELATED DATA ---------- */
    repository: {
      type: Schema.Types.ObjectId,
      ref: "Repository"
    },

    pullRequest: {
      type: Schema.Types.ObjectId,
      ref: "PullRequest"
    },

    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment"
    },

    /* ---------- INVITATION TOKEN (for in-app contributor invites) ---------- */
    invitationToken: {
      type: String,
      default: null
    },

    /* ---------- READ STATUS ---------- */
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

/* ---------- INDEXES ---------- */
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

export const Notification = mongoose.model(
  "Notification",
  notificationSchema
);