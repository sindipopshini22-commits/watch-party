'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import UniversalPlayer from '@/components/UniversalPlayer';
import ChatSidebar from '@/components/ChatSidebar';
import DanmakuOverlay from '@/components/DanmakuOverlay';
import TicTacToeGame from '@/components/TicTacToeGame';
import MovieRoulette from '@/components/MovieRoulette';
import MoodMeter from '@/components/MoodMeter';
import InvitePanel from '@/components/InvitePanel';
import { io, Socket } from 'socket.io-client';
import { Dices, Gamepad2, Loader2, ArrowLeft, ListTree, Users } from 'lucide-react';

interface Episode {
  id: string;
  number: number;
  title: string;
  overview: string | null;
  air_date: string | null;
  video_source: string;
  source_id: string;
}

interface Season {
  id: string;
  number: number;
  title: string | null;
  movie_id: string;
}

interface Movie {
  id: string;
  title: string;
  overview: string;
  release_year: number;
  poster_url: string;
  backdrop_url?: string;
  video_source: string;
  source_id: string;
}

interface RoomResponse {
  id: string;
  current_movie?: Movie;
  current_episode_id?: string | null;
}

export default function WatchPartyRoom() {
  const params = useParams();
  const roomId = params.roomId as string;
  const router = useRouter();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [showRoulette, setShowRoulette] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [activeViewers, setActiveViewers] = useState(1);

  const userId = `user-${Math.floor(Math.random() * 10000)}`;

  const loadSeasons = async (movieId: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/api/movies/${movieId}/seasons`);
    if (res.ok) {
      const data = await res.json();
      setSeasons(data);
      if (data.length > 0) {
        setSelectedSeasonId(data[0].id);
        loadEpisodes(data[0].id);
      }
    }
  };

  const loadEpisodes = async (seasonId: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/api/seasons/${seasonId}/episodes`);
    if (res.ok) {
      const data = await res.json();
      setEpisodes(data);
      if (data.length > 0 && !currentEpisode) {
        setCurrentEpisode(data[0]);
      }
    }
  };

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/api/rooms/${roomId}`)
      .then(res => res.json() as Promise<RoomResponse>)
      .then(data => {
        if (data.current_movie) {
          setMovie(data.current_movie);
          loadSeasons(data.current_movie.id);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    const s = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000');
    setSocket(s);
    s.emit('join-room', roomId, userId);

    s.on('active-viewers', (count: number) => setActiveViewers(count));

    return () => {
      s.emit('leave-room', roomId, userId);
      s.off('active-viewers');
      s.disconnect();
    };
  }, [roomId]);

  const handleSeasonChange = (seasonId: string) => {
    setSelectedSeasonId(seasonId);
    loadEpisodes(seasonId);
  };

  const handleEpisodeSelect = (episode: Episode) => {
    setCurrentEpisode(episode);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center text-white">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center text-white gap-4">
        <h1 className="text-2xl font-bold">Room Not Found</h1>
        <button onClick={() => router.push('/')} className="text-accent hover:text-accent-2 transition-colors">
          Return to Catalog
        </button>
      </div>
    );
  }

  const activeSourceId = currentEpisode ? currentEpisode.source_id : movie.source_id;
  const activeVideoSource = currentEpisode ? currentEpisode.video_source : movie.video_source;

  return (
    <div className="flex h-screen bg-background text-white overflow-hidden font-sans">
      <div className="flex-1 flex flex-col">
        <header className="relative h-20 flex items-center px-6 md:px-10 bg-black/80 backdrop-blur-xl border-b border-white/5 shrink-0 z-10 overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <img src={movie.backdrop_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/60" />
          </div>

          <div className="relative z-10 flex items-center gap-4 flex-1">
            <button
              onClick={() => router.push('/')}
              className="mr-2 text-neutral-300 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="min-w-0">
              <h1 className="text-base md:text-lg font-bold text-white truncate">
                {currentEpisode ? `${movie.title} - ${currentEpisode.title}` : movie.title}
              </h1>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {activeViewers}
                </span>
                <span className="text-neutral-700">|</span>
                <span className="text-accent font-semibold">Live</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <button
              onClick={() => setShowRoulette(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-white/5 text-xs font-semibold text-neutral-200 hover:border-accent/40 transition-colors"
            >
              <Dices size={16} className="text-accent" />
              Roulette
            </button>
            <button
              onClick={() => setShowGame(!showGame)}
              className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-colors ${
                showGame ? 'bg-accent text-black border-accent' : 'bg-surface border-white/5 text-neutral-200 hover:border-accent/40'
              }`}
            >
              <Gamepad2 size={16} />
              Mini-Game
            </button>
            <InvitePanel />
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-background p-4 md:p-8">
          <div className="w-full max-w-6xl aspect-video relative rounded-2xl overflow-hidden border border-white/5 shadow-2xl shadow-black/40">
            <UniversalPlayer
              socket={socket}
              roomId={roomId}
              video_source={activeVideoSource}
              source_id={activeSourceId}
            />
            <DanmakuOverlay socket={socket} roomId={roomId} />
          </div>

          {showGame && (
            <div className="absolute left-4 top-4 z-20">
              <TicTacToeGame socket={socket} roomId={roomId} userId={userId} />
            </div>
          )}

          <div className="absolute right-4 bottom-4 z-20 w-80">
            <MoodMeter socket={socket} roomId={roomId} />
          </div>
        </main>
      </div>

      <ChatSidebar
        socket={socket}
        roomId={roomId}
        userId={userId}
        onSendReaction={(emoji) => {
          if (socket) socket.emit('send-reaction', { roomId, emoji });
        }}
      />

      {seasons.length > 0 && (
        <div className="absolute top-24 left-6 z-30 w-80 bg-surface/90 backdrop-blur-xl border border-white/5 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center gap-2 mb-3">
            <ListTree size={16} className="text-accent" />
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Episodes</span>
          </div>

          <select
            value={selectedSeasonId}
            onChange={(e) => handleSeasonChange(e.target.value)}
            className="w-full bg-surface-2 border border-white/5 rounded-xl px-3 py-2 text-sm text-white mb-3 focus:outline-none focus:border-accent/50"
          >
            {seasons.map(season => (
              <option key={season.id} value={season.id}>
                Season {season.number}{season.title ? ` - ${season.title}` : ''}
              </option>
            ))}
          </select>

          <div className="max-h-64 overflow-y-auto space-y-1 hide-scrollbar">
            {episodes.map(ep => (
              <button
                key={ep.id}
                onClick={() => handleEpisodeSelect(ep)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                  currentEpisode?.id === ep.id
                    ? 'bg-accent text-black font-semibold'
                    : 'bg-surface-2 text-neutral-300 hover:bg-white/5'
                }`}
              >
                <span className="font-semibold">Ep {ep.number}</span>
                <span className="ml-2 text-xs opacity-80">{ep.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showRoulette && (
        <MovieRoulette
          onClose={() => setShowRoulette(false)}
          onSelectMovie={(id) => {
            console.log('Selected movie:', id);
            setShowRoulette(false);
          }}
        />
      )}
    </div>
  );
}
