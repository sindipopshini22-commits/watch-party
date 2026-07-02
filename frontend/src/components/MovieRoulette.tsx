'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dices } from 'lucide-react';

interface MovieRouletteProps {
  onClose: () => void;
  onSelectMovie: (movieId: string) => void;
}

export default function MovieRoulette({ onClose, onSelectMovie }: MovieRouletteProps) {
  const [spinning, setSpinning] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);

  const mockMovies = [
    { id: '1', title: 'Big Buck Bunny', genre: 'Animation', year: 2008 },
    { id: '2', title: 'Sintel', genre: 'Fantasy', year: 2010 },
    { id: '3', title: 'Tears of Steel', genre: 'Sci-Fi', year: 2012 },
    { id: '4', title: 'Elephants Dream', genre: 'Animation', year: 2006 }
  ];

  const spin = () => {
    setSpinning(true);
    setSelectedResult(null);
    
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * mockMovies.length);
      setSelectedResult(mockMovies[randomIndex]);
      setSpinning(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Dices className="text-purple-500" /> Movie Roulette
        </h2>

        <div className="h-40 flex items-center justify-center bg-neutral-950 rounded-xl mb-6 border border-neutral-800 relative overflow-hidden">
          {spinning && (
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.5, ease: 'linear' }}
              className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full absolute"
            />
          )}
          
          <AnimatePresence>
            {selectedResult && !spinning && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <div className="text-xl font-bold text-white">{selectedResult.title}</div>
                <div className="text-neutral-400 text-sm mt-1">{selectedResult.genre} • {selectedResult.year}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button 
          onClick={spin}
          disabled={spinning}
          className={`w-full py-3 rounded-xl font-bold text-lg transition-all ${
            spinning 
              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 shadow-lg shadow-purple-500/20 cursor-pointer'
          }`}
        >
          {spinning ? 'Spinning...' : 'Spin the Wheel!'}
        </button>

        {selectedResult && !spinning && (
          <button 
            onClick={() => onSelectMovie(selectedResult.id)}
            className="w-full py-3 mt-3 rounded-xl font-bold text-lg bg-white text-black hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            Watch Now
          </button>
        )}
      </div>
    </div>
  );
}
