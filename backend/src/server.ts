import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { registerRoomHandlers } from './sockets/roomHandler';
import aiAssistantRouter from './routes/aiAssistant';
import moviesRouter from './routes/movies';
import livekitRouter from './routes/livekit';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // To be restricted in production
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket: Socket) => {
  console.log('New socket connected:', socket.id);
  registerRoomHandlers(io, socket);

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

app.use('/api', moviesRouter);
app.use('/api/ai', aiAssistantRouter);
app.use('/api/livekit', livekitRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
