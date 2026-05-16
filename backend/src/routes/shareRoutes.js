import { Router } from "express";
import { getSharedNoteByName, updateSharedNoteByName } from "../controllers/noteController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { validateNoteUpdate } from "../validators/noteValidator.js";

export const shareRoutes = Router();

shareRoutes.get("/:username/:shareName", getSharedNoteByName);
shareRoutes.put("/:username/:shareName", requireAuth, validateNoteUpdate, updateSharedNoteByName);
