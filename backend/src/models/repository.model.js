import mongoose, { Schema } from "mongoose";

const repositorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    contributors: [
      {
        type: Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private"
    },

    rules: {
    type: Schema.Types.Mixed,
    default: {
      // minCommitMessageLength: 5,
      // disallowTodo: false,
      // disallowConsoleLog: false
      }
    }
  },
  { timestamps: true }
);

export const Repository = mongoose.model("Repository", repositorySchema);