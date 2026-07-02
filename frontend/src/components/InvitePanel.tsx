'use client';

import { useState } from 'react';
import { Share2, MessageCircle, Check } from 'lucide-react';

interface InvitePanelProps {
  roomId?: string;
}

export default function InvitePanel({ roomId }: InvitePanelProps) {
  const [copied, setCopied] = useState(false);
  const [showInstagram, setShowInstagram] = useState(false);

  const url = typeof window !== 'undefined' ? window.location.href : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Join my Watch Party! ${url}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={copyLink}
        className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
          copied
            ? 'bg-green-600 border-green-500 text-white'
            : 'bg-[#121212] hover:bg-[#1A1A1A] border-neutral-800 text-neutral-300'
        }`}
      >
        {copied ? <Check size={16} /> : <Share2 size={16} />}
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
      <button
        onClick={shareWhatsApp}
        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#121212] hover:bg-[#1A1A1A] border border-neutral-800 text-xs font-semibold transition-all cursor-pointer text-green-400"
      >
        <MessageCircle size={16} />
        WhatsApp
      </button>
      <button
        onClick={shareFacebook}
        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#121212] hover:bg-[#1A1A1A] border border-neutral-800 text-xs font-semibold transition-all cursor-pointer text-blue-400"
      >
        <Share2 size={16} />
        Facebook
      </button>
      <button
        onClick={() => setShowInstagram(true)}
        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#121212] hover:bg-[#1A1A1A] border border-neutral-800 text-xs font-semibold transition-all cursor-pointer text-pink-400"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
        Instagram
      </button>
      {showInstagram && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <button
              onClick={() => setShowInstagram(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              Share on Instagram
            </h2>
            <p className="text-neutral-300 text-sm mb-4">
              Instagram does not allow direct programmatic URL injection from web apps. To invite friends:
            </p>
            <ol className="list-decimal list-inside text-neutral-400 text-sm space-y-2 mb-6">
              <li>Copy the watch party link</li>
              <li>Open Instagram and create a new Story or Post</li>
              <li>Paste the link in your caption or bio</li>
              <li>Tag your friends to invite them</li>
            </ol>
            <button
              onClick={copyLink}
              className="w-full py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition-opacity cursor-pointer"
            >
              Copy Link & Open Instagram
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
