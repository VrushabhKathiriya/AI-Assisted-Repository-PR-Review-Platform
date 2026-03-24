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

/* ---------- AI ISSUE SUB-SCHEMA ---------- */
const aiIssueSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["critical", "warning", "suggestion"],
      required: true
    },
    issue: {
      type: String
    },
    why: {
      type: String
    },
    fix: {
      type: String
    }
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
    summary: {
      type: String
    },
    issues: [aiIssueSchema],
    improvements: [
      {
        type: String
      }
    ],
    commitMessageFeedback: {
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
      maxlength: 100
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