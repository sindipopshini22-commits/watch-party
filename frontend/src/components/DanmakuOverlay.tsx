'use client';

import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

interface DanmakuReaction {
  id: string;
  emoji: string;
  top: string;
}

interface DanmakuOverlayProps {
  socket: Socket | null;
  roomId: string;
}

export default function DanmakuOverlay({ socket, roomId }: DanmakuOverlayProps) {
  const [reactions, setReactions] = useState<DanmakuReaction[]>([]);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('room-reaction', (emoji: string) => {
      const id = Math.random().toString(36).substr(2, 9);
      const top = `${Math.floor(Math.random() * 70) + 10}%`;
      
      setReactions(prev => [...prev, { id, emoji, top }]);
      
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== id));
      }, 5000);
    });

    return () => {
      socket.off('room-reaction');
    };
  }, [socket]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50 rounded-lg">
      <AnimatePresence>
        {reactions.map((reaction) => (
          <motion.div
            key={reaction.id}
            initial={{ left: '100%', opacity: 1, scale: 0.5 }}
            animate={{ left: '-20%', opacity: [1, 1, 0.8, 0], scale: [0.5, 1.5, 1, 0.5] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 4, ease: 'linear' }}
            className="absolute text-4xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            style={{ top: reaction.top }}
          >
            {reaction.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
