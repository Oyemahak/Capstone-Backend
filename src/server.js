import 'dotenv/config';
import connectDB from './config/db.js';
import app from './app.js';
import http from 'http';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

// (optional) auth handshake – wire up later to your JWT util
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('unauthorized'));
    // TODO: verify JWT like your HTTP middleware (jwt.verify)
    socket.user = { _id: 'placeholder', role: 'developer' };
    next();
  } catch {
    next(new Error('unauthorized'));
  }
});

io.on('connection', (socket) => {
  socket.on('join', (room) => socket.join(room));
  socket.on('leave', (room) => socket.leave(room));
});

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 API ready on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect DB:', err);
    process.exit(1);
  });