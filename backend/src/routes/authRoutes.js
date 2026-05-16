import { Router } from "express";
import { login, register } from "../controllers/authController.js";
import { validateAuthPayload } from "../validators/authValidator.js";

export const authRoutes = Router();

authRoutes.post("/register", validateAuthPayload, register);
authRoutes.post("/login", validateAuthPayload, login);
