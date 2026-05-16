import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "./config/env.js";
import { Note } from "./models/noteModel.js";
import { User } from "./models/userModel.js";

const getUserFromToken = async (token) => {
  if (!token) return null;

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    return User.findById(payload.sub).select("_id email name");
  } catch (_error) {
    return null;
  }
};

const roomName = ({ username, shareName }) =>
  `note:${String(username).toLowerCase()}:${String(shareName).toLowerCase()}`;

const findSharedNote = async ({ username, shareName }) => {
  const owner = await User.findOne({ username: String(username).toLowerCase() }).select("_id");
  if (!owner) return null;

  return Note.findOne({
    owner: owner._id,
    shareName: String(shareName).toLowerCase(),
  }).select("owner");
};

const canEditSharedNote = async ({ username, shareName, token }) => {
  const user = await getUserFromToken(token);
  if (!user) return false;

  const note = await findSharedNote({ username, shareName });
  return Boolean(note);
};

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[socket] client connected: ${socket.id}`);

    socket.on("note:join", async ({ username, shareName }) => {
      if (!username || !shareName) {
        console.log(`[socket] note:join rejected — missing username or shareName`);
        return;
      }

      const room = roomName({ username, shareName });
      const note = await findSharedNote({ username, shareName });

      if (!note) {
        console.log(`[socket] note:join — note not found for ${username}/${shareName}`);
        return;
      }

      socket.join(room);
      console.log(`[socket] ${socket.id} joined room: ${room} (room size: ${io.sockets.adapter.rooms.get(room)?.size})`);
    });

    socket.on("note:leave", ({ username, shareName }) => {
      if (!username || !shareName) return;
      const room = roomName({ username, shareName });
      socket.leave(room);
      console.log(`[socket] ${socket.id} left room: ${room}`);
    });

    socket.on("note:change", async ({ username, shareName, title, content, token }) => {
      if (!username || !shareName) {
        console.log(`[socket] note:change rejected — missing username or shareName`);
        return;
      }

      const room = roomName({ username, shareName });
      const roomSize = io.sockets.adapter.rooms.get(room)?.size ?? 0;
      console.log(`[socket] note:change from ${socket.id} in room: ${room} (room size: ${roomSize})`);

      if (!(await canEditSharedNote({ username, shareName, token }))) {
        console.log(`[socket] note:change rejected — canEditSharedNote returned false`);
        return;
      }

      socket.to(room).emit("note:changed", {
        title,
        content,
      });
      console.log(`[socket] note:changed broadcasted to room: ${room}`);
    });

    socket.on("note:saved", async ({ username, shareName, note, token }) => {
      if (!username || !shareName || !note) return;

      const room = roomName({ username, shareName });
      console.log(`[socket] note:saved from ${socket.id} in room: ${room}`);

      if (!(await canEditSharedNote({ username, shareName, token }))) {
        console.log(`[socket] note:saved rejected — canEditSharedNote returned false`);
        return;
      }

      socket.to(room).emit("note:saved", {
        note,
      });
      console.log(`[socket] note:saved broadcasted to room: ${room}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`[socket] client disconnected: ${socket.id} (reason: ${reason})`);
    });
  });
};
