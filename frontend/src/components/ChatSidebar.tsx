'use client';

import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { Send } from 'lucide-react';
import LiveKitChat from './LiveKitChat';

interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  timestamp: number;
}

interface ChatSidebarProps {
  socket: Socket | null;
  roomId: string;
  userId: string;
  onSendReaction: (emoji: string) => void;
}

export default function ChatSidebar({ socket, roomId, userId, onSendReaction }: ChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;
    socket.on('chat-message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => {
      socket.off('chat-message');
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    
    const msg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      text: input.trim(),
      timestamp: Date.now()
    };
    
    socket.emit('chat-message', { roomId, message: msg });
    setInput('');
  };

  const reactions = ['😂', '😭', '😱', '❤️', '🔥'];

  return (
    <div className="w-96 h-full bg-[#080808] border-l border-neutral-900 flex flex-col font-sans shadow-2xl">
      <div className="p-6">
        <h2 className="text-xl font-bold text-white tracking-tight">Live Chat</h2>
      </div>

      <div className="px-6 pb-6">
        <LiveKitChat roomId={roomId} userId={userId} />
      </div>
      
      {/* Messages area with subtle fade */}
      <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4 scrollbar-hide">
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.userId === userId ? 'items-end' : 'items-start'}`}>
            <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm leading-relaxed transition-all ${
              m.userId === userId 
                ? 'bg-blue-600 text-white rounded-tr-sm shadow-md' 
                : 'bg-[#1A1A1A] text-neutral-200 rounded-tl-sm border border-neutral-800'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area styled to match screenshot */}
      <div className="p-6 bg-black/40 backdrop-blur-sm border-t border-neutral-900">
        <div className="flex justify-between gap-1 mb-5 px-1">
          {reactions.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSendReaction(emoji)}
              className="text-xl hover:scale-125 transition-all p-2 bg-[#121212] rounded-full w-10 h-10 flex items-center justify-center border border-neutral-800 hover:border-neutral-600 cursor-pointer shadow-sm"
            >
              {emoji}
            </button>
          ))}
        </div>
        <form onSubmit={sendMessage} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-[#121212] border border-neutral-800 rounded-full px-5 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all pr-12 placeholder:text-neutral-600 shadow-inner"
            placeholder="Say something..."
          />
          <button 
            type="submit" 
            className="absolute right-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full p-2.5 transition-all cursor-pointer shadow-lg active:scale-95 group"
          >
            <Send size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
}
