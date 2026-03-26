import mongoose, { Schema } from "mongoose";

const activitySchema = new Schema(
  {
    repository: {
      type: Schema.Types.ObjectId,
      ref: "Repository",
      required: true
    },

    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    type: {
      type: String,
      enum: [
        "repo_created",
        "file_created",
        "file_updated",
        "file_deleted",
        "pr_created",
        "pr_accepted",
        "pr_rejected",
        "contributor_added",
        "contributor_removed",
        "comment_added",
        "rule_updated"
      ],
      required: true
    },

    message: {
      type: String,
      required: true
    },

    /* Related data */
    file: {
      type: Schema.Types.ObjectId,
      ref: "File"
    },

    pullRequest: {
      type: Schema.Types.ObjectId,
      ref: "PullRequest"
    },

    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment"
    },

    targetUser: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

/* ---------- INDEXES ---------- */
activitySchema.index({ repository: 1, createdAt: -1 });
activitySchema.index({ performedBy: 1, createdAt: -1 });

export const Activity = mongoose.model("Activity", activitySchema);