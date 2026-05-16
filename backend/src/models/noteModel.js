import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [1, "Title cannot be empty"],
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    content: {
      type: String,
      trim: true,
      maxlength: [10000, "Content cannot exceed 10000 characters"],
      default: "",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shareName: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      match: [/^[a-z0-9-]+$/, "Share name can only contain lowercase letters, numbers, and hyphens"],
    },
    sharePermission: {
      type: String,
      enum: ["viewer", "editor"],
      default: "editor",
    },
    editHistory: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: true,
        },
        editedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

noteSchema.index({ owner: 1, updatedAt: -1 });
noteSchema.index({ owner: 1, shareName: 1 }, { unique: true, sparse: true });

export const Note = mongoose.model("Note", noteSchema);
