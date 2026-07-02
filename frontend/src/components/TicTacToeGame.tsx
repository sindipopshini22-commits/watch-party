'use client';

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface TicTacToeProps {
  socket: Socket | null;
  roomId: string;
  userId: string;
}

export default function TicTacToeGame({ socket, roomId, userId }: TicTacToeProps) {
  const [board, setBoard] = useState<string[]>(Array(9).fill(''));
  const [xIsNext, setXIsNext] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;
    socket.on('tictactoe-state', (data: { board: string[], xIsNext: boolean, winner: string | null }) => {
      setBoard(data.board);
      setXIsNext(data.xIsNext);
      setWinner(data.winner);
    });

    return () => {
      socket.off('tictactoe-state');
    };
  }, [socket]);

  const handleClick = (i: number) => {
    if (board[i] || winner || !socket) return;
    
    const newBoard = [...board];
    newBoard[i] = xIsNext ? 'X' : 'O';
    
    socket.emit('tictactoe-action', {
      roomId,
      board: newBoard,
      xIsNext: !xIsNext
    });
  };

  const handleReset = () => {
    if (socket) {
      socket.emit('tictactoe-reset', { roomId });
    }
  };

  return (
    <div className="bg-neutral-900 p-4 rounded-lg shadow-xl font-sans text-white border border-neutral-800 w-64 pointer-events-auto">
      <h3 className="text-lg font-bold mb-4 text-center">Mini-Game: Tic-Tac-Toe</h3>
      
      {winner ? (
        <div className="text-center mb-4 text-green-400 font-bold">Winner: {winner}</div>
      ) : (
        <div className="text-center mb-4 text-neutral-400">Next player: {xIsNext ? 'X' : 'O'}</div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-4">
        {board.map((cell, i) => (
          <button
            key={i}
            className="h-16 bg-neutral-800 rounded flex items-center justify-center text-2xl font-bold hover:bg-neutral-700 transition-colors cursor-pointer border border-neutral-700"
            onClick={() => handleClick(i)}
          >
            {cell}
          </button>
        ))}
      </div>

      <button 
        className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded font-semibold transition-colors cursor-pointer"
        onClick={handleReset}
      >
        Reset Game
      </button>
    </div>
  );
}
