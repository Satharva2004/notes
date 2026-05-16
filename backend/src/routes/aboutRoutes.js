import { Router } from "express";
import { getAbout } from "../controllers/aboutController.js";

export const aboutRoutes = Router();

aboutRoutes.get("/about", getAbout);
