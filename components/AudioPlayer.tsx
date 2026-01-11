
import React, { useEffect, useRef } from 'react';
import { RadioStream } from '../types';

interface AudioPlayerProps {
  stream: RadioStream | null;
  onClose: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ stream, onClose }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.play().catch(e => console.error("Audio playback failed", e));
    }
  }, [stream]);

  if (!stream) return null;

  return (
    <div className="bg-green-700/80 p-4 rounded-xl flex items-center justify-between mb-4 border border-green-500/50 backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-3">
        <div className="relative">
          <i className="fa-solid fa-volume-high text-white animate-pulse" />
          <div className="absolute -inset-1 bg-white/20 rounded-full animate-ping opacity-50" />
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-green-200">Receiving Signal...</div>
          <div className="font-bold text-white truncate max-w-[200px]">{stream.name}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <audio ref={audioRef} src={stream.url} />
        <button 
          onClick={onClose}
          className="bg-red-500 hover:bg-red-600 p-2 rounded-lg transition-colors"
        >
          <i className="fa-solid fa-stop text-white" />
        </button>
      </div>
    </div>
  );
};

export default AudioPlayer;
