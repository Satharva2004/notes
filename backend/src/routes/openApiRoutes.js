import { Router } from "express";
import { getOpenApi } from "../controllers/openApiController.js";

export const openApiRoutes = Router();

openApiRoutes.get("/openapi.json", getOpenApi);
