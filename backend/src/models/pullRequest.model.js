import mongoose, { Schema } from "mongoose";

/* ---------- RULE RESULT SUB-SCHEMA ---------- */
const ruleResultSchema = new Schema(
  {
    passed: {
      type: Boolean,
      required: true
    },
    issues: [
      {
        type: String
      }
    ]
  },
  { _id: false }
);

/* ---------- AI RESULT SUB-SCHEMA ---------- */
const aiResultSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["good", "bad"],
      required: true
    },
    suggestions: [
      {
        type: String
      }
    ],
    explanation: {
      type: String
    }
  },
  { _id: false }
);

/* ---------- PR SCHEMA ---------- */
const pullRequestSchema = new Schema(
  {
    repository: {
      type: Schema.Types.ObjectId,
      ref: "Repository",
      required: true
    },

    file: {
      type: Schema.Types.ObjectId,
      ref: "File",
      required: true
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    newContent: {
      type: String,
      required: true
    },

    message: {
      type: String,
      required: true,
      maxlength: 30
    },

    ruleResult: {
      type: ruleResultSchema,
      required: true
    },

    aiResult: {
      type: aiResultSchema,
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending"
    },

    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },

    /* 🔥 NEW FIELD */
    reviewedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

/* ---------- INDEXES ---------- */
pullRequestSchema.index({ repository: 1, status: 1 });
pullRequestSchema.index({ file: 1 });

export const PullRequest = mongoose.model("PullRequest", pullRequestSchema);