import http from "http";
import { app } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { setupSocket } from "./socket.js";

await connectDatabase();

const server = http.createServer(app);
setupSocket(server);

server.listen(env.port, () => {
  console.log(`Backend server running on port ${env.port}`);
});
