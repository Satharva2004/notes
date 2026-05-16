import mongoose from "mongoose";

export const MAX_NOTE_CONTENT_LENGTH = 5_000_000;

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
      maxlength: [MAX_NOTE_CONTENT_LENGTH, "Content cannot exceed 5MB"],
      default: "",
    },
    fontFamily: {
      type: String,
      trim: true,
      maxlength: [160, "Font family cannot exceed 160 characters"],
      default: "'Geist', system-ui, sans-serif",
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
noteSchema.index(
  { owner: 1, shareName: 1 },
  { unique: true, partialFilterExpression: { shareName: { $type: "string" } } }
);
noteSchema.index({ title: "text", content: "text" });

export const Note = mongoose.model("Note", noteSchema);
