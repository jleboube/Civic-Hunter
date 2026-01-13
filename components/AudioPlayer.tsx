
import React, { useEffect, useRef, useState } from 'react';
import { RadioStream } from '../types';

interface AudioPlayerProps {
  stream: RadioStream | null;
  onClose: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ stream, onClose }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      setError(null);
      setIsPlaying(false);

      // Set volume before playing
      audioRef.current.volume = volume;

      // Attempt to play
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(e => {
            console.error("Audio playback failed:", e);
            setError("Click play to start stream");
          });
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [stream]);

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setError(null);
        })
        .catch(e => {
          setError("Stream unavailable");
          console.error("Play failed:", e);
        });
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    onClose();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  if (!stream) return null;

  return (
    <div className="bg-green-700/80 p-4 rounded-xl mb-4 border border-green-500/50 backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <i className={`fa-solid ${isPlaying ? 'fa-volume-high' : 'fa-volume-xmark'} text-white ${isPlaying ? 'animate-pulse' : ''}`} />
            {isPlaying && <div className="absolute -inset-1 bg-white/20 rounded-full animate-ping opacity-50" />}
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-green-200">
              {isPlaying ? 'Receiving Signal...' : error || 'Ready to Connect'}
            </div>
            <div className="font-bold text-white truncate max-w-[200px]">{stream.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isPlaying && (
            <button
              onClick={handlePlay}
              className="bg-green-500 hover:bg-green-400 p-2 rounded-lg transition-colors"
            >
              <i className="fa-solid fa-play text-white" />
            </button>
          )}
          <button
            onClick={handleStop}
            className="bg-red-500 hover:bg-red-600 p-2 rounded-lg transition-colors"
          >
            <i className="fa-solid fa-stop text-white" />
          </button>
        </div>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-2">
        <i className="fa-solid fa-volume-low text-white/60 text-xs" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={handleVolumeChange}
          className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-green-400"
        />
        <i className="fa-solid fa-volume-high text-white/60 text-xs" />
      </div>

      {/* Hidden audio element with proper attributes */}
      <audio
        ref={audioRef}
        src={stream.url}
        preload="none"
        crossOrigin="anonymous"
        onError={(e) => {
          console.error("Audio error:", e);
          setError("Stream connection failed");
          setIsPlaying(false);
        }}
        onPlaying={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
};

export default AudioPlayer;
