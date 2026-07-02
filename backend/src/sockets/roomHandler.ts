import { Server, Socket } from 'socket.io';
import { redis } from '../redisClient';

export function registerRoomHandlers(io: Server, socket: Socket) {
  socket.on('join-room', async (roomId: string, userId: string) => {
    socket.join(roomId);
    console.log(`User ${userId} joined room ${roomId}`);
    
    // Catch-Up Sync Request Protocol
    const roomStateRaw = await redis.get(`room:${roomId}:state`);
    if (roomStateRaw) {
      try {
        const roomState = JSON.parse(roomStateRaw);
        socket.emit('catch-up-sync', roomState);
      } catch (e) {
        console.error('Failed to parse room state', e);
      }
    }
  });

  socket.on('leave-room', (roomId: string, userId: string) => {
    socket.leave(roomId);
    console.log(`User ${userId} left room ${roomId}`);
  });

  socket.on('media-action', async (data: { roomId: string, action: 'PLAY' | 'PAUSE' | 'SEEK', timestamp: number }) => {
    const { roomId, action, timestamp } = data;
    
    const roomState = {
      action,
      timestamp,
      updatedAt: Date.now()
    };
    
    // Update internal Redis temporary space
    await redis.set(`room:${roomId}:state`, JSON.stringify(roomState), 'EX', 3600); // expire in 1 hour
    
    // Push state broadcasts downstream to all guests
    io.to(roomId).emit('video-state-changed', roomState);
  });

  socket.on('chat-message', (data: { roomId: string, message: any }) => {
    const { roomId, message } = data;
    // Broadcast to others
    socket.to(roomId).emit('chat-message', message);
    // And send to sender
    socket.emit('chat-message', message);
  });

  socket.on('send-reaction', async (data: { roomId: string, emoji: string }) => {
    const { roomId, emoji } = data;
    // Broadcast to everyone in room including sender
    io.to(roomId).emit('room-reaction', emoji);

    // Mood meter aggregation
    try {
      const timestamp = Math.floor(Date.now() / 10000) * 10;
      const key = `mood:${roomId}:${timestamp}`;
      await redis.incr(key);
      await redis.expire(key, 3600);
    } catch (e) {
      console.error('Failed to aggregate mood', e);
    }
  });

  socket.on('tictactoe-action', (data: { roomId: string, board: string[], xIsNext: boolean }) => {
    const { roomId, board, xIsNext } = data;
    const winner = calculateWinner(board);
    io.to(roomId).emit('tictactoe-state', { board, xIsNext, winner });
  });

  socket.on('tictactoe-reset', (data: { roomId: string }) => {
    const { roomId } = data;
    io.to(roomId).emit('tictactoe-state', { board: Array(9).fill(''), xIsNext: true, winner: null });
  });
}

function calculateWinner(squares: string[]) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}
