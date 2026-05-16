import cors from "cors";
import express from "express";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { routes } from "./routes/index.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);
