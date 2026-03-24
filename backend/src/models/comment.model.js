import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
  {
    pullRequest: {
      type: Schema.Types.ObjectId,
      ref: "PullRequest",
      required: true
    },

    repository: {
      type: Schema.Types.ObjectId,
      ref: "Repository",
      required: true
    },

    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },

    isEdited: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

/* ---------- INDEXES ---------- */
commentSchema.index({ pullRequest: 1, createdAt: 1 });
commentSchema.index({ author: 1 });

export const Comment = mongoose.model("Comment", commentSchema);