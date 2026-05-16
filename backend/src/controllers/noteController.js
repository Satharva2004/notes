import { Note } from "../models/noteModel.js";
import { env } from "../config/env.js";
import { toNoteResponse, toSharedNoteResponse } from "../utils/noteResponse.js";
import { User } from "../models/userModel.js";

const visibleNoteQuery = (userId, id) => ({
  _id: id,
  owner: userId,
});

const toUsername = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);

const ensureUsername = async (user) => {
  if (user.username) return user.username;

  const base = toUsername(user.name || user.email.split("@")[0]) || "user";
  let username = base;
  let suffix = 1;

  while (await User.exists({ username, _id: { $ne: user._id } })) {
    suffix += 1;
    username = `${base}-${suffix}`;
  }

  user.username = username;
  await user.save();

  return username;
};

export const getNotes = async (req, res, next) => {
  try {
    const notes = await Note.find({
      owner: req.user._id,
    }).sort({ updatedAt: -1 });

    res.status(200).json(notes.map((note) => toNoteResponse(note, req.user)));
  } catch (error) {
    next(error);
  }
};

export const getNoteById = async (req, res, next) => {
  try {
    const note = await Note.findOne(visibleNoteQuery(req.user._id, req.params.id));

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.status(200).json(toNoteResponse(note, req.user));
  } catch (error) {
    next(error);
  }
};

export const createNote = async (req, res, next) => {
  try {
    const note = await Note.create({
      title: req.body.title,
      content: req.body.content,
      owner: req.user._id,
    });

    res.status(201).json(toNoteResponse(note, req.user));
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, owner: req.user._id });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    note.title = req.body.title;
    note.content = req.body.content;

    const existingEditor = note.editHistory.find((entry) => entry.email === req.user.email);
    if (existingEditor) {
      existingEditor.name = req.user.name || req.user.email;
      existingEditor.editedAt = new Date();
    } else {
      note.editHistory.push({
        user: req.user._id,
        name: req.user.name || req.user.email,
        email: req.user.email,
        editedAt: new Date(),
      });
    }

    await note.save();

    res.status(200).json(toNoteResponse(note, req.user));
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const shareNote = async (req, res, next) => {
  try {
    const username = await ensureUsername(req.user);
    const note = await Note.findOne({ _id: req.params.id, owner: req.user._id });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    const existingNote = await Note.findOne({
      owner: req.user._id,
      shareName: req.body.share_name,
      _id: { $ne: note._id },
    });

    if (existingNote) {
      return res.status(409).json({ message: "You already have a shared note with this name" });
    }

    note.shareName = req.body.share_name;
    note.sharePermission = req.body.permission;
    await note.save();

    res.status(200).json({
      message: "Share link created successfully",
      share_link: `${env.appBaseUrl}/${username}/${note.shareName}`,
      username,
      share_name: note.shareName,
    });
  } catch (error) {
    next(error);
  }
};

export const getSharedNoteByName = async (req, res, next) => {
  try {
    const owner = await User.findOne({ username: req.params.username.toLowerCase() }).select("_id username");

    if (!owner) {
      return res.status(404).json({ message: "Shared note not found" });
    }

    const note = await Note.findOne({
      owner: owner._id,
      shareName: req.params.shareName.toLowerCase(),
    }).populate("owner", "username");

    if (!note) {
      return res.status(404).json({ message: "Shared note not found" });
    }

    res.status(200).json(toSharedNoteResponse(note));
  } catch (error) {
    next(error);
  }
};

export const updateSharedNoteByName = async (req, res, next) => {
  try {
    const owner = await User.findOne({ username: req.params.username.toLowerCase() }).select("_id username");

    if (!owner) {
      return res.status(404).json({ message: "Shared note not found" });
    }

    const note = await Note.findOne({
      owner: owner._id,
      shareName: req.params.shareName.toLowerCase(),
    }).populate("owner", "username");

    if (!note) {
      return res.status(404).json({ message: "Shared note not found" });
    }

    note.title = req.body.title;
    note.content = req.body.content;
    const existingEditor = note.editHistory.find((entry) => entry.email === req.user.email);
    if (existingEditor) {
      existingEditor.name = req.user.name || req.user.email;
      existingEditor.editedAt = new Date();
    } else {
      note.editHistory.push({
        user: req.user._id,
        name: req.user.name || req.user.email,
        email: req.user.email,
        editedAt: new Date(),
      });
    }
    await note.save();

    res.status(200).json(toSharedNoteResponse(note));
  } catch (error) {
    next(error);
  }
};
