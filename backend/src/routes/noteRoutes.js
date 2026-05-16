import { Router } from "express";
import {
  createNote,
  deleteNote,
  getNoteById,
  getNotes,
  searchNotes,
  shareNote,
  updateNote,
} from "../controllers/noteController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { validateObjectId } from "../validators/objectIdValidator.js";
import { validateNoteCreate, validateNoteUpdate } from "../validators/noteValidator.js";
import { validateSharePayload } from "../validators/shareValidator.js";

export const noteRoutes = Router();

noteRoutes.use(requireAuth);

noteRoutes.get("/", getNotes);
noteRoutes.get("/search", searchNotes);
noteRoutes.post("/", validateNoteCreate, createNote);
noteRoutes.get("/:id", validateObjectId("id"), getNoteById);
noteRoutes.put("/:id", validateObjectId("id"), validateNoteUpdate, updateNote);
noteRoutes.delete("/:id", validateObjectId("id"), deleteNote);
noteRoutes.post("/:id/share", validateObjectId("id"), validateSharePayload, shareNote);
