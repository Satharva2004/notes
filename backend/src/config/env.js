import "dotenv/config";

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET || "note-taking-local-secret",
  appBaseUrl: process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 5000}`,
};
