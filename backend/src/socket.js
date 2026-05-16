import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "./config/env.js";
import { User } from "./models/userModel.js";
import { canEditNote, findSocketNote, noteRoomName } from "./utils/sharedNoteAccess.js";

const getUserFromToken = async (token) => {
  if (!token) return null;

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    return User.findById(payload.sub).select("_id email name username");
  } catch (_error) {
    return null;
  }
};

const getEditableSocketNote = async ({ noteId, username, shareName, token }) => {
  const user = await getUserFromToken(token);
  const note = await findSocketNote({ noteId, username, shareName });

  if (!canEditNote(note, user)) return null;

  return note;
};

export const setupSocket = (server) => {
  const roomParticipants = new Map();

  const emitPresence = (room) => {
    const participants = Array.from(roomParticipants.get(room)?.values() || []);
    io.to(room).emit("note:presence", { participants });
  };

  const leavePresenceRoom = (socket, room) => {
    const participants = roomParticipants.get(room);
    if (!participants) return;

    participants.delete(socket.id);
    if (participants.size === 0) {
      roomParticipants.delete(room);
    } else {
      emitPresence(room);
    }
  };

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[socket] connected ${socket.id}`);

    socket.on("note:join", async ({ noteId, username, shareName, participant }) => {
      if (!noteId && (!username || !shareName)) {
        console.log("[socket] join rejected: missing note id or shared path");
        return;
      }

      const note = await findSocketNote({ noteId, username, shareName });
      if (!note) {
        console.log("[socket] join rejected: note not found");
        return;
      }

      const room = noteRoomName(note);
      socket.join(room);
      socket.data.noteRooms = socket.data.noteRooms || new Set();
      socket.data.noteRooms.add(room);
      if (!roomParticipants.has(room)) roomParticipants.set(room, new Map());
      roomParticipants.get(room).set(socket.id, {
        socketId: socket.id,
        name: participant?.name || "Guest",
        email: participant?.email || "",
      });
      emitPresence(room);
      console.log(`[socket] ${socket.id} joined ${room}`);
    });

    socket.on("note:leave", async ({ noteId, username, shareName }) => {
      const note = await findSocketNote({ noteId, username, shareName });
      if (!note) return;

      const room = noteRoomName(note);
      socket.leave(room);
      socket.data.noteRooms?.delete(room);
      leavePresenceRoom(socket, room);
      console.log(`[socket] ${socket.id} left ${room}`);
    });

    socket.on("note:change", async ({ noteId, username, shareName, title, content, token }) => {
      if (!noteId && (!username || !shareName)) {
        console.log("[socket] change rejected: missing note id or shared path");
        return;
      }

      const note = await getEditableSocketNote({ noteId, username, shareName, token });
      if (!note) {
        console.log("[socket] change rejected: user cannot edit note");
        return;
      }

      socket.to(noteRoomName(note)).emit("note:changed", {
        noteId: note._id.toString(),
        title,
        content,
      });
    });

    socket.on("note:saved", async ({ noteId, username, shareName, note: savedNote, token }) => {
      if ((!noteId && (!username || !shareName)) || !savedNote) return;

      const note = await getEditableSocketNote({ noteId, username, shareName, token });
      if (!note) {
        console.log("[socket] save rejected: user cannot edit note");
        return;
      }

      socket.to(noteRoomName(note)).emit("note:saved", {
        note: savedNote,
      });
    });

    socket.on("disconnecting", () => {
      for (const room of socket.data.noteRooms || []) {
        leavePresenceRoom(socket, room);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`[socket] disconnected ${socket.id}: ${reason}`);
    });
  });
};
