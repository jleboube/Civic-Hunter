
import React, { useState, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MapContainer, { MapContainerRef } from './components/MapContainer';
import TopNav from './components/TopNav';
import FloatingPanels from './components/FloatingPanels';
import { NewsArticle, Incident } from './types';

// Alert detail modal for non-location alerts
interface AlertModalProps {
  item: NewsArticle | Incident | null;
  onClose: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  const isWeatherRelated = item.category?.toLowerCase().includes('weather') ||
    item.title?.toLowerCase().includes('weather') ||
    item.title?.toLowerCase().includes('storm') ||
    item.title?.toLowerCase().includes('rain') ||
    item.title?.toLowerCase().includes('snow') ||
    item.title?.toLowerCase().includes('wind') ||
    item.title?.toLowerCase().includes('flood') ||
    item.title?.toLowerCase().includes('tornado') ||
    item.title?.toLowerCase().includes('hurricane');

  const getSeverityColor = () => {
    if ('priority' in item) {
      if (item.priority >= 80) return 'border-red-500 bg-red-500/10';
      if (item.priority >= 60) return 'border-orange-500 bg-orange-500/10';
      return 'border-yellow-500 bg-yellow-500/10';
    }
    if ('sentiment' in item) {
      if (item.sentiment?.toLowerCase() === 'negative') return 'border-red-500 bg-red-500/10';
      if (item.sentiment?.toLowerCase() === 'positive') return 'border-green-500 bg-green-500/10';
    }
    return 'border-cyan-500 bg-cyan-500/10';
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={onClose}>
      <div
        className={`bg-[#0d1117] border-2 ${getSeverityColor()} rounded-lg max-w-md w-full mx-4 shadow-2xl`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <i className={`fa-solid ${isWeatherRelated ? 'fa-cloud-bolt text-yellow-400' : 'fa-circle-info text-cyan-400'}`} />
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              {isWeatherRelated ? 'Weather Alert' : 'Signal Intelligence'}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <h3 className="text-lg font-bold text-white leading-tight">{item.title}</h3>

          {'description' in item && item.description && (
            <p className="text-sm text-slate-300">{item.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs">
            {'source' in item && (
              <div className="bg-black/30 p-2 rounded">
                <span className="text-slate-500 block">Source</span>
                <span className="text-white font-medium">{item.source}</span>
              </div>
            )}
            {'category' in item && item.category && (
              <div className="bg-black/30 p-2 rounded">
                <span className="text-slate-500 block">Category</span>
                <span className="text-cyan-400 font-medium uppercase">{item.category}</span>
              </div>
            )}
            {'time' in item && (
              <div className="bg-black/30 p-2 rounded">
                <span className="text-slate-500 block">Time</span>
                <span className="text-white font-medium">{item.time}</span>
              </div>
            )}
            {'priority' in item && (
              <div className="bg-black/30 p-2 rounded">
                <span className="text-slate-500 block">Priority</span>
                <span className={`font-bold ${item.priority >= 80 ? 'text-red-400' : item.priority >= 60 ? 'text-orange-400' : 'text-yellow-400'}`}>
                  {item.priority >= 80 ? 'CRITICAL' : item.priority >= 60 ? 'HIGH' : 'MEDIUM'}
                </span>
              </div>
            )}
            {'sentiment' in item && item.sentiment && (
              <div className="bg-black/30 p-2 rounded">
                <span className="text-slate-500 block">Sentiment</span>
                <span className={`font-medium ${
                  item.sentiment.toLowerCase() === 'negative' ? 'text-red-400' :
                  item.sentiment.toLowerCase() === 'positive' ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {item.sentiment.toUpperCase()}
                </span>
              </div>
            )}
            {'address' in item && item.address && (
              <div className="bg-black/30 p-2 rounded col-span-2">
                <span className="text-slate-500 block">Location</span>
                <span className="text-white font-medium">{item.address}</span>
              </div>
            )}
            {'location' in item && item.location && !('address' in item) && (
              <div className="bg-black/30 p-2 rounded col-span-2">
                <span className="text-slate-500 block">Location</span>
                <span className="text-white font-medium">{item.location}</span>
              </div>
            )}
          </div>

          {isWeatherRelated && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
              <div className="flex items-center gap-2 text-yellow-400 mb-2">
                <i className="fa-solid fa-triangle-exclamation" />
                <span className="font-bold text-sm">Weather Advisory</span>
              </div>
              <p className="text-xs text-slate-300">
                This weather-related alert may affect road conditions and emergency response times.
                Exercise caution in affected areas.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded text-sm font-medium hover:bg-cyan-500/30 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [selectedAlert, setSelectedAlert] = useState<NewsArticle | Incident | null>(null);
  const mapRef = useRef<MapContainerRef>(null);

  const handleAlertClick = useCallback((item: NewsArticle | Incident) => {
    // Check if item has valid coordinates
    const hasLocation = 'lat' in item && 'lng' in item && item.lat && item.lng;

    if (hasLocation && mapRef.current) {
      // Pan map to location with smooth animation
      mapRef.current.panTo(item.lat as number, item.lng as number, 14);
    }

    // Always show the modal with details
    setSelectedAlert(item);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0e14] text-slate-200 selection:bg-green-500/30">
      {/* Main OSINT Dashboard Layout */}
      <TopNav />

      <main className="flex-1 relative flex pt-14">
        {/* Primary Functional Panel */}
        <Sidebar />

        {/* Map Visualization Workspace */}
        <div className="flex-1 relative">
          <MapContainer ref={mapRef} />

          {/* Global UI Overlays */}
          <FloatingPanels onAlertClick={handleAlertClick} />
        </div>
      </main>

      {/* Alert Detail Modal */}
      <AlertModal item={selectedAlert} onClose={() => setSelectedAlert(null)} />

      {/* OSINT Scanning Overlay Lines (Aesthetic) */}
      <div className="fixed inset-0 pointer-events-none border-[12px] border-white/5 z-50 rounded-lg m-2 mix-blend-overlay" />
    </div>
  );
};

export default App;
