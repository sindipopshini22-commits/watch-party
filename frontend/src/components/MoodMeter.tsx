'use client';

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Activity } from 'lucide-react';

interface MoodMeterProps {
  socket: Socket | null;
  roomId: string;
}

export default function MoodMeter({ socket, roomId }: MoodMeterProps) {
  const [dataPoints, setDataPoints] = useState<number[]>(Array(40).fill(0));

  useEffect(() => {
    if (!socket) return;
    
    const handleReaction = () => {
      setDataPoints(prev => {
        const newData = [...prev];
        newData[newData.length - 1] += 1;
        return newData;
      });
    };
    
    socket.on('room-reaction', handleReaction);

    const interval = setInterval(() => {
      setDataPoints(prev => {
        const newData = [...prev.slice(1), 0];
        return newData;
      });
    }, 1000);

    return () => {
      socket.off('room-reaction', handleReaction);
      clearInterval(interval);
    };
  }, [socket]);

  return (
    <div className="bg-[#0D0D0D]/90 backdrop-blur-md p-5 rounded-2xl border border-neutral-800/50 w-full shadow-2xl font-sans pointer-events-auto ring-1 ring-white/5">
      <h3 className="text-[10px] font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-[0.2em] opacity-80">
        <Activity size={12} className="text-green-500" />
        Live Mood Meter
      </h3>
      
      {/* Dashed Line / Wave Chart to match screenshot */}
      <div className="h-5 flex items-center gap-[3px]">
        {dataPoints.map((val, i) => (
          <div 
            key={i} 
            className={`w-6 h-[2px] rounded-full transition-all duration-500 ${
              val > 0 
                ? 'bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.8)] opacity-100' 
                : 'bg-green-900/20 opacity-40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
