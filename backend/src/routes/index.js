import { Router } from "express";
import { aboutRoutes } from "./aboutRoutes.js";
import { authRoutes } from "./authRoutes.js";
import { healthRoutes } from "./healthRoutes.js";
import { noteRoutes } from "./noteRoutes.js";
import { openApiRoutes } from "./openApiRoutes.js";
import { shareRoutes } from "./shareRoutes.js";

export const routes = Router();

routes.use(authRoutes);
routes.use(aboutRoutes);
routes.use(openApiRoutes);
routes.use("/health", healthRoutes);
routes.use("/notes", noteRoutes);
routes.use(shareRoutes);
