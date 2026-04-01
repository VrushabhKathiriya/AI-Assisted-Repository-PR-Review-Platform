import mongoose, { Schema } from "mongoose";

const invitationSchema = new Schema(
  {
    repository: {
      type: Schema.Types.ObjectId,
      ref: "Repository",
      required: true
    },

    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    invitedUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    token: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "expired"],
      default: "pending"
    },

    expiresAt: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

/* ---------- INDEXES ---------- */
invitationSchema.index({ token: 1 });
invitationSchema.index({ repository: 1, invitedUser: 1 });
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Invitation = mongoose.model("Invitation", invitationSchema);