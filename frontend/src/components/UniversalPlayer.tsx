'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';

interface UniversalPlayerProps {
  socket: Socket | null;
  roomId: string;
  video_source: string;
  source_id: string;
}

export default function UniversalPlayer({ socket, roomId, video_source, source_id }: UniversalPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const applyState = useCallback((state: any) => {
    if (video_source !== 'DIRECT_MP4') return;
    setIsSyncing(true);
    const timeDiff = (Date.now() - state.updatedAt) / 1000;
    const targetTime = state.action === 'PLAY' ? state.timestamp + timeDiff : state.timestamp;
    if (videoRef.current) {
      const current = videoRef.current.currentTime || 0;
      if (Math.abs(current - targetTime) > 1) videoRef.current.currentTime = targetTime;
      if (state.action === 'PLAY') {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
    setTimeout(() => { setIsSyncing(false); }, 500);
  }, [video_source]);

  useEffect(() => {
    if (!socket) return;
    socket.on('catch-up-sync', applyState);
    socket.on('video-state-changed', applyState);
    return () => {
      socket.off('catch-up-sync', applyState);
      socket.off('video-state-changed', applyState);
    };
  }, [socket, applyState]);

  const emitAction = (action: string, timestamp: number) => {
    if (isSyncing || !socket) return;
    socket.emit('media-action', { roomId, action, timestamp });
  };

  const handleUserInteraction = () => {
    setHasInteracted(true);
    if (videoRef.current && videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    }
  };

  if (video_source === 'YOUTUBE') {
    return (
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
        <iframe
          src={`https://www.youtube.com/embed/${source_id}?autoplay=1&modestbranding=1&rel=0`}
          className="w-full h-full border-0"
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture"
        />
      </div>
    );
  }

  if (video_source === 'DIRECT_MP4') {
    return (
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
        <video
          ref={videoRef}
          src={source_id}
          preload="auto"
          playsInline
          className="w-full h-full object-contain"
          controls
          id="room-video-player"
          onPlay={() => {
            setIsPlaying(true);
            emitAction('PLAY', videoRef.current?.currentTime || 0);
          }}
          onPause={() => {
            setIsPlaying(false);
            emitAction('PAUSE', videoRef.current?.currentTime || 0);
          }}
          onSeeked={() => {
            emitAction('SEEK', videoRef.current?.currentTime || 0);
          }}
          onClick={handleUserInteraction}
        />
        {!hasInteracted && !isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer" onClick={handleUserInteraction}>
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
      <iframe
        key={source_id}
        src={video_source === 'ARCHIVE_EMBED' ? source_id : `https://www.bilibili.tv/en/space/video-embed-html?id=${source_id}`}
        className="w-full h-full border-0"
        allowFullScreen
        allow="autoplay; encrypted-media; picture-in-picture"
      />
    </div>
  );
}
