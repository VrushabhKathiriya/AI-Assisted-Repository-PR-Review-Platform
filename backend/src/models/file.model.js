import mongoose, { Schema } from "mongoose";

/* ---------- VERSION SUB-SCHEMA ---------- */
const versionSchema = new Schema(
  {
    content: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: 30
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

/* ---------- FILE SCHEMA ---------- */
const fileSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[a-zA-Z0-9._-]+$/.test(v);
        },
        message: "Invalid file name"
      }
    },

    repository: {
      type: Schema.Types.ObjectId,
      ref: "Repository",
      required: true
    },

    size: {
      type: Number,
      default: 0
    },

    versions: {
      type: [versionSchema],
      default: []
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

/* ---------- UNIQUE FILE NAME PER REPO ---------- */
fileSchema.index({ name: 1, repository: 1 }, { unique: true });

/* ---------- PRE SAVE: CALCULATE SIZE ---------- */
fileSchema.pre("save", function () {
  if (this.versions.length > 0) {
    const latestContent = this.versions[this.versions.length - 1].content;
    this.size = Buffer.byteLength(latestContent, "utf-8");
  }
});

export const File = mongoose.model("File", fileSchema);