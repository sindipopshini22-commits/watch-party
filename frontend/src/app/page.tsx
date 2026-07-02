'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Loader2, Star } from 'lucide-react';

const GENRE_POOL = [
  'Action', 'Adventure', 'Animation', 'Biography', 'Comedy',
  'Crime', 'Documentary', 'Drama', 'Fantasy', 'Horror',
  'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War'
];

function deterministicRating(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  const score = 3 + ((Math.abs(hash) % 20) / 10);
  return Math.min(5, Number(score.toFixed(1)));
}

function movieGenres(id: string): string[] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 37 + id.charCodeAt(i)) | 0;
  const count = 2 + (Math.abs(hash) % 2);
  const picks: string[] = [];
  for (let j = 0; j < count; j++) {
    picks.push(GENRE_POOL[(Math.abs(hash) + j) % GENRE_POOL.length]);
  }
  return [...new Set(picks)];
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

export default function Catalog() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingRoomId, setCreatingRoomId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/api/movies`)
      .then(res => res.json())
      .then(data => {
        setMovies(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleCreateRoom = async (movieId: string) => {
    setCreatingRoomId(movieId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId })
      });
      const data = await res.json();
      if (data.roomId) {
        router.push(`/room/${data.roomId}`);
      } else {
        setCreatingRoomId(null);
      }
    } catch (e) {
      console.error(e);
      setCreatingRoomId(null);
    }
  };

  const heroMovie = useMemo(() => {
    if (!movies.length) return null;
    return movies[Math.floor(Math.random() * movies.length)];
  }, [movies]);

  const rows = useMemo(() => {
    const shuffled = [...movies].sort(() => Math.random() - 0.5);
    const rowSize = 8;
    const rowsArr: any[][] = [];
    for (let i = 0; i < shuffled.length; i += rowSize) {
      rowsArr.push(shuffled.slice(i, i + rowSize));
    }
    return rowsArr;
  }, [movies]);

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const fill = i <= rating ? 'text-yellow-400' : 'text-neutral-600';
      stars.push(
        <Star key={i} size={14} className={`${fill} fill-current`} />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-white">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white font-sans selection:bg-accent/30">
      {/* Hero */}
      {heroMovie && (
        <section className="relative w-full h-[85vh] min-h-[520px]">
          <div className="absolute inset-0">
            <img
              src={heroMovie.backdrop_url}
              alt={heroMovie.title}
              className="w-full h-full object-cover opacity-70"
            />
            <div className="hero-gradient absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
          </div>

           <div className="relative z-10 flex items-end h-full max-w-7xl mx-auto w-full px-6 md:px-10 pb-16">
             <div className="max-w-2xl relative">
               <div className="flex items-center gap-2 mb-4">
                 <span className="text-accent font-bold tracking-widest text-xs uppercase">Featured</span>
                 <span className="h-px w-8 bg-accent" />
               </div>

               <h1 className="text-5xl md:text-7xl font-black leading-[0.95] mb-4 tracking-tight">
                 {heroMovie.title}
               </h1>

               <div className="flex items-center gap-4 mb-5 text-sm">
                 <span className="text-neutral-300 font-semibold">{heroMovie.release_year}</span>
                 <span className="text-neutral-600">|</span>
                 <div className="flex items-center gap-1">
                   {renderStars(deterministicRating(heroMovie.id))}
                 </div>
               </div>

               <div className="flex flex-wrap gap-2 mb-6">
                 {movieGenres(heroMovie.id).map(g => (
                   <span key={g} className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-neutral-200">
                     {g}
                   </span>
                 ))}
               </div>

               <p className="text-neutral-300 text-base md:text-lg leading-relaxed mb-8 line-clamp-3">
                 {heroMovie.overview}
               </p>

               <button
                 onClick={() => handleCreateRoom(heroMovie.id)}
                 disabled={creatingRoomId === heroMovie.id}
                 className="group inline-flex items-center gap-3 px-8 py-3.5 bg-accent text-black font-bold rounded-full hover:scale-105 transition-transform"
               >
                 {creatingRoomId === heroMovie.id ? (
                   <Loader2 className="animate-spin" size={18} />
                 ) : (
                   <Play className="fill-current" size={18} />
                 )}
                 <span>Watch Now</span>
               </button>
             </div>

             <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-72 xl:w-80 shrink-0">
               <div className="relative">
                 <div className="absolute -inset-10 bg-gradient-to-r from-background/0 via-background/40 to-background/80 blur-2xl" />
                 <img
                   src={heroMovie.poster_url}
                   alt={heroMovie.title}
                   className="relative w-full h-auto rounded-3xl border border-white/10 shadow-2xl shadow-black/60 rotate-3 hover:rotate-0 transition-transform duration-500"
                   onError={(e) => {
                     e.currentTarget.style.display = 'none';
                   }}
                 />
                 <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-background/60 via-transparent to-transparent" />
               </div>
             </div>
           </div>
        </section>
      )}

      {/* Rows */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 space-y-10">
        {rows.map((row, rowIdx) => (
          <section key={rowIdx}>
            <h2 className="text-xl font-bold mb-4 text-neutral-100">
              {rowIdx === 0 ? 'Trending Now' : rowIdx === 1 ? 'Top Picks' : 'More to Watch'}
            </h2>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
              {row.map(movie => {
                const rating = deterministicRating(movie.id);
                const genres = movieGenres(movie.id);
                return (
                  <div
                    key={movie.id}
                    onClick={() => handleCreateRoom(movie.id)}
                    className="group relative min-w-[220px] md:min-w-[260px] aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer bg-surface border border-white/5 card-glow transition-all duration-300 hover:-translate-y-1"
                  >
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.fallback-poster')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'fallback-poster absolute inset-0 flex flex-col items-center justify-center bg-surface-2 p-4 text-center';
                          fallback.innerHTML = `<div class="text-3xl mb-2">🎬</div><p class="text-white text-xs font-semibold leading-tight">${movie.title}</p>`;
                          parent.appendChild(fallback);
                        }
                      }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 rounded-full bg-accent text-black flex items-center justify-center">
                        <Play className="fill-current ml-1" size={22} />
                      </div>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <h3 className="text-white font-bold text-sm mb-1 truncate">{movie.title}</h3>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-neutral-300 font-medium">{movie.release_year}</span>
                        <div className="flex items-center gap-0.5">
                          {renderStars(rating)}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {genres.slice(0, 2).map(g => (
                          <span key={g} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-neutral-300 border border-white/5">
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
