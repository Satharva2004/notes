import { Note } from "../models/noteModel.js";
import { User } from "../models/userModel.js";
import mongoose from "mongoose";

const normalizePathPart = (value) => String(value || "").trim().toLowerCase();

export const findSharedNoteByPath = async ({ username, shareName }) => {
  const owner = await User.findOne({ username: normalizePathPart(username) }).select("_id username");
  if (!owner) return null;

  return Note.findOne({
    owner: owner._id,
    shareName: normalizePathPart(shareName),
  }).populate("owner", "username");
};

export const findSocketNote = async ({ noteId, username, shareName }) => {
  if (noteId) {
    if (!mongoose.isValidObjectId(noteId)) return null;
    return Note.findById(noteId).populate("owner", "username");
  }

  if (username && shareName) {
    return findSharedNoteByPath({ username, shareName });
  }

  return null;
};

export const canEditNote = (note, user) => {
  if (!note || !user) return false;

  const ownerId = note.owner?._id || note.owner;
  if (ownerId?.toString() === user._id.toString()) return true;

  return note.shareName && note.sharePermission === "editor";
};

export const noteRoomName = (note) => `note:${note._id.toString()}`;
