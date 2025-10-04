// backend/src/server.js
import "dotenv/config";
import connectDB from "./config/db.js";
import app from "./app.js";
import http from "http";
import { Server } from "socket.io";
import { verifyMailer } from "./lib/mailer.js";

const PORT = process.env.PORT || 4000;

async function boot() {
  await connectDB();
  console.log("✅ MongoDB connected");

  await verifyMailer(); // logs ready or warns, does not crash

  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: "*" } });
  app.set("io", io);

  // (Optional) later: JWT handshake
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("unauthorized"));
      socket.user = { _id: "placeholder", role: "developer" };
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join", (room) => socket.join(room));
    socket.on("leave", (room) => socket.leave(room));
  });

  server.listen(PORT, () => {
    console.log(`🚀 API ready on http://localhost:${PORT}`);
  });
}

boot().catch((err) => {
  console.error("Fatal boot error:", err);
  process.exit(1);
});