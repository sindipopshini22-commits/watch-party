'use client';

import { useRef, useState, useEffect } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Video, VideoOff, Camera, Mic } from 'lucide-react';

interface LiveKitChatProps {
  roomId: string;
  userId: string;
}

export default function LiveKitChat({ roomId, userId }: LiveKitChatProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880';
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

  const attachStream = (mediaStream: MediaStream) => {
    const video = videoRef.current;
    if (video) {
      video.srcObject = mediaStream;
      video.load();
      video.play().catch(() => {});
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      setStream(mediaStream);
      attachStream(mediaStream);
      return mediaStream;
    } catch (e) {
      console.error('getUserMedia failed:', e);
      setError('Camera/mic permission denied or unavailable.');
      return null;
    }
  };

  const joinCall = async () => {
    setError(null);
    const mediaStream = await startCamera();
    if (!mediaStream) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/livekit/token?roomId=${roomId}&userId=${userId}`);
      if (!res.ok) throw new Error('Token request failed');
      const data = await res.json();
      if (!data.token) throw new Error('No token returned');
      setToken(data.token);
    } catch (e) {
      console.error('LiveKit token error:', e);
      setError('LiveKit unavailable. Camera preview is active locally.');
    }
  };

  const leaveCall = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
    setStream(null);
    setToken(null);
    setError(null);
  };

  if (!stream && !token) {
    return (
      <button
        onClick={joinCall}
        className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl transition-all shadow-[0_4px_15px_rgba(37,99,235,0.3)] active:scale-[0.98] cursor-pointer"
      >
        <Video size={18} />
        Join Video Call
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
          <Camera size={14} />
          Video Conference
        </span>
        <button
          onClick={leaveCall}
          className="text-neutral-600 hover:text-red-400 transition-colors p-1 cursor-pointer"
          title="Leave Call"
        >
          <VideoOff size={16} />
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden border border-neutral-800 bg-black shadow-2xl relative" style={{ height: '300px' }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />
        <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10" />
        <div className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
          <Mic size={10} />
          You
        </div>

        {token && (
          <div className="absolute inset-0 z-20 bg-black">
            <LiveKitRoom
              token={token}
              serverUrl={LIVEKIT_URL}
              video={true}
              audio={true}
              data-lk-theme="default"
              style={{ height: '100%' }}
            >
              <VideoConference />
              <RoomAudioRenderer />
            </LiveKitRoom>
          </div>
        )}

        {error && (
          <div className="absolute top-3 right-3 z-30">
            <div className="flex items-center gap-1.5 bg-red-500/20 text-red-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-red-500/30 uppercase tracking-wider">
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
