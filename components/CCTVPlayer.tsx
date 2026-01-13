
import React, { useState, useEffect } from 'react';
import { Camera } from '../types';

interface CCTVPlayerProps {
  camera: Camera | null;
  onClose: () => void;
  allCameras?: Camera[];
  onCameraChange?: (camera: Camera) => void;
}

const CCTVPlayer: React.FC<CCTVPlayerProps> = ({ camera, onClose, allCameras = [], onCameraChange }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now());
  const [imageError, setImageError] = useState(false);

  // Auto-refresh image every 5 seconds
  useEffect(() => {
    if (!camera) return;

    const interval = setInterval(() => {
      setImageKey(Date.now());
    }, 5000);

    return () => clearInterval(interval);
  }, [camera]);

  if (!camera) return null;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setImageError(false);
    setImageKey(Date.now());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Generate the image URL based on camera source
  const getImageUrl = () => {
    // For NYC cameras, use their specific URL format
    if (camera.id.startsWith('nyc-') || camera.source === 'NYC DOT') {
      const camId = camera.id.replace('nyc-', '');
      return `https://webcams.nyctmc.org/multiviewer/data/${camId}/snapshot.jpg?t=${imageKey}`;
    }
    // Use streamUrl if available
    if (camera.streamUrl) {
      return `${camera.streamUrl}${camera.streamUrl.includes('?') ? '&' : '?'}t=${imageKey}`;
    }
    // Use url if available
    if (camera.url) {
      return `${camera.url}${camera.url.includes('?') ? '&' : '?'}t=${imageKey}`;
    }
    // Fallback placeholder
    return `https://picsum.photos/seed/${camera.id}/800/450`;
  };

  // Filter cameras from same source/location for perspective switching
  const relatedCameras = allCameras.filter(c =>
    c.id !== camera.id && (
      c.source === camera.source ||
      c.location === camera.location ||
      (c.lat && camera.lat && Math.abs(c.lat - camera.lat) < 0.05 && Math.abs(c.lng! - camera.lng!) < 0.05)
    )
  ).slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl mx-4">
        {/* Header */}
        <div className="bg-black/90 border border-white/10 rounded-t-lg p-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs font-black text-white uppercase tracking-widest">LIVE FEED</span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-sm font-bold text-cyan-400">{camera.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              title="Refresh feed"
            >
              <i className={`fa-solid fa-arrows-rotate ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <i className="fa-solid fa-xmark text-lg" />
            </button>
          </div>
        </div>

        {/* Video/Image Player */}
        <div className="relative bg-black aspect-video border-x border-white/10">
          {imageError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
              <i className="fa-solid fa-video-slash text-4xl mb-3" />
              <p className="text-sm">Feed unavailable</p>
              <button
                onClick={handleRefresh}
                className="mt-3 px-4 py-2 bg-white/10 rounded text-xs hover:bg-white/20 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <img
                key={imageKey}
                src={getImageUrl()}
                alt={camera.name}
                className="w-full h-full object-contain"
                onError={() => setImageError(true)}
              />
              {/* Overlay info */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-2 py-1 bg-red-600 rounded text-[10px] font-black text-white">LIVE</span>
                <span className="px-2 py-1 bg-black/70 rounded text-[10px] text-white">
                  <i className="fa-solid fa-eye mr-1" />{camera.viewers} viewers
                </span>
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                <div>
                  <p className="text-xs text-white font-bold">{camera.location}</p>
                  <p className="text-[10px] text-slate-400">{camera.source || 'CCTV Network'}</p>
                </div>
                <div className="text-[10px] text-slate-400">
                  Auto-refresh: 5s
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer with camera info and perspective switcher */}
        <div className="bg-black/90 border border-t-0 border-white/10 rounded-b-lg p-3">
          {/* Camera Details */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span>
                <i className="fa-solid fa-location-dot text-cyan-400 mr-1" />
                {camera.lat?.toFixed(4)}, {camera.lng?.toFixed(4)}
              </span>
              <span>
                <i className="fa-solid fa-signal text-green-400 mr-1" />
                {camera.status === 'active' ? 'Active' : camera.status}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 uppercase">{camera.source}</span>
          </div>

          {/* Perspective Switcher */}
          {relatedCameras.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-black mb-2">
                <i className="fa-solid fa-video mr-1" /> Nearby Perspectives
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {relatedCameras.map(cam => (
                  <button
                    key={cam.id}
                    onClick={() => onCameraChange?.(cam)}
                    className="flex-shrink-0 w-24 bg-white/5 rounded border border-white/10 hover:border-cyan-500/50 transition-all overflow-hidden group"
                  >
                    <div className="aspect-video bg-slate-900 relative">
                      <img
                        src={cam.streamUrl || cam.url || `https://picsum.photos/seed/${cam.id}/100/60`}
                        alt={cam.name}
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${cam.id}/100/60` }}
                      />
                      <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-green-500 rounded-full" />
                    </div>
                    <p className="text-[8px] text-white p-1 truncate">{cam.name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No nearby cameras message */}
          {relatedCameras.length === 0 && (
            <p className="text-[10px] text-slate-600 text-center py-2">
              No nearby perspectives available
            </p>
          )}
        </div>
      </div>

      {/* Click outside to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  );
};

export default CCTVPlayer;
