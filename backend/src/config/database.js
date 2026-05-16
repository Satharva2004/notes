import mongoose from "mongoose";
import { env } from "./env.js";
import { Note } from "../models/noteModel.js";
import { User } from "../models/userModel.js";

export const connectDatabase = async () => {
  if (!env.mongoUri) {
    throw new Error("MONGO_URI is required");
  }

  await mongoose.connect(env.mongoUri);
  await User.syncIndexes();
  await Note.syncIndexes();
  console.log("MongoDB connected");
};
