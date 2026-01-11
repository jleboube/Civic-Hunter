
import React, { useState, useEffect } from 'react';
import { fetchNews, fetchCameras, fetchIncidents } from '../services/dataService';
import { NewsArticle, Camera, Incident } from '../types';

interface FloatingPanelsProps {
  onAlertClick?: (item: NewsArticle | Incident) => void;
}

const FloatingPanels: React.FC<FloatingPanelsProps> = ({ onAlertClick }) => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isNewsVisible, setIsNewsVisible] = useState(true);
  const [isIncidentsVisible, setIsIncidentsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [newsData, cameraData, incidentData] = await Promise.all([
          fetchNews(),
          fetchCameras(),
          fetchIncidents()
        ]);
        setNews(newsData);
        setCameras(cameraData);
        setIncidents(incidentData);
      } catch (error) {
        console.error('Error loading panel data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Auto-refresh every 60 seconds
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const getSentimentColor = (sentiment?: string) => {
    if (!sentiment) return 'bg-slate-500';
    const s = sentiment.toLowerCase();
    if (s === 'negative') return 'bg-red-500';
    if (s === 'positive') return 'bg-green-500';
    return 'bg-yellow-500';
  };

  const activeCameras = cameras.filter(c => c.status === 'active').length;
  const highPriority = incidents.filter(i => i.priority >= 70).length;
  const negativeSentiment = news.filter(n => n.sentiment?.toLowerCase() === 'negative').length;
  const sentimentTrend = negativeSentiment > news.length / 2 ? 'Downtrend' : 'Stable';

  return (
    <>
      {/* News Panel */}
      {isNewsVisible && (
        <div className="absolute top-20 right-4 w-80 bg-black/90 backdrop-blur-md rounded border border-white/10 shadow-2xl transition-all duration-500 z-30">
          <div className="p-3 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-satellite-dish text-cyan-400 text-xs" />
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Signal Intelligence</h3>
            </div>
            <div className="flex items-center gap-2">
              {isLoading && (
                <div className="animate-spin w-3 h-3 border border-cyan-500 border-t-transparent rounded-full" />
              )}
              <button onClick={() => setIsNewsVisible(false)} className="text-slate-500 hover:text-white">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          </div>
          <div className="p-2 space-y-3 max-h-[300px] overflow-y-auto">
            {news.length === 0 ? (
              <div className="text-center py-4 text-slate-500 text-xs">
                <i className="fa-solid fa-radar animate-pulse" />
                <p className="mt-2">Scanning news feeds...</p>
              </div>
            ) : (
              news.slice(0, 8).map((item, i) => (
                <div
                  key={item.id || i}
                  className="border-b border-white/5 pb-2 last:border-0 cursor-pointer hover:bg-white/5 rounded transition-colors p-1 -mx-1"
                  onClick={() => onAlertClick?.(item)}
                >
                  <div className="flex gap-2">
                    <div className={`w-1 h-full min-h-[32px] rounded-full ${getSentimentColor(item.sentiment)}`} />
                    <div className="flex-1">
                      <h4 className="text-[11px] font-bold text-slate-100 leading-tight line-clamp-2 hover:text-cyan-400 transition-colors">
                        {item.title}
                      </h4>
                      <div className="flex justify-between mt-1 items-center">
                        <span className="text-[8px] text-slate-500 font-black uppercase">{item.source}</span>
                        <span className="text-[8px] text-green-500">{item.time}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {item.category && (
                          <span className="text-[7px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded uppercase">
                            {item.category}
                          </span>
                        )}
                        {item.location && (
                          <span className="text-[7px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                            <i className="fa-solid fa-location-dot mr-1" />{item.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center text-slate-600 hover:text-cyan-400">
                      <i className="fa-solid fa-chevron-right text-[8px]" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-2 border-t border-white/10">
            <div className="text-[8px] text-slate-500 text-center">
              <span className="cursor-pointer hover:text-cyan-400" onClick={() => setIsIncidentsVisible(true)}>
                Click for incidents
              </span>
              {' | '}{news.length} articles tracked
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button when closed */}
      {!isNewsVisible && (
        <button
          onClick={() => setIsNewsVisible(true)}
          className="absolute top-20 right-4 bg-black/80 px-3 py-2 rounded border border-white/10 text-white hover:bg-white/10 z-30"
        >
          <i className="fa-solid fa-newspaper mr-2" />
          <span className="text-xs">News ({news.length})</span>
        </button>
      )}

      {/* Incidents Panel */}
      {isIncidentsVisible && (
        <div className="absolute top-20 left-4 w-80 bg-black/90 backdrop-blur-md rounded border border-red-500/30 shadow-2xl transition-all duration-500 z-30">
          <div className="p-3 border-b border-white/10 flex justify-between items-center bg-red-500/10">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation text-red-400 text-xs animate-pulse" />
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest">High Priority Incidents</h3>
            </div>
            <button onClick={() => setIsIncidentsVisible(false)} className="text-slate-500 hover:text-white">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="p-2 space-y-2 max-h-[350px] overflow-y-auto">
            {incidents.filter(i => i.priority >= 60).length === 0 ? (
              <div className="text-center py-4 text-slate-500 text-xs">
                <i className="fa-solid fa-check-circle text-green-500" />
                <p className="mt-2">No high priority incidents</p>
              </div>
            ) : (
              incidents.filter(i => i.priority >= 60).slice(0, 10).map((incident, i) => (
                <div
                  key={incident.id || i}
                  className="bg-black/40 rounded p-2 cursor-pointer hover:bg-white/5 transition-colors border-l-2"
                  style={{
                    borderColor: incident.priority >= 80 ? '#ef4444' : incident.priority >= 70 ? '#f97316' : '#eab308'
                  }}
                  onClick={() => onAlertClick?.(incident)}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-[11px] font-bold text-slate-100 leading-tight flex-1 hover:text-cyan-400 transition-colors">
                      {incident.title}
                    </h4>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded ml-2 font-bold ${
                      incident.priority >= 80 ? 'bg-red-500/20 text-red-400' :
                      incident.priority >= 70 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {incident.priority >= 80 ? 'CRITICAL' : incident.priority >= 70 ? 'HIGH' : 'MEDIUM'}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 line-clamp-1">{incident.address}</p>
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-[8px] text-cyan-400 uppercase">{incident.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] text-slate-500">{incident.source}</span>
                      <span className="text-[8px] text-green-500">{incident.time}</span>
                    </div>
                  </div>
                  {incident.lat && incident.lng && (
                    <div className="mt-1 text-[8px] text-green-400">
                      <i className="fa-solid fa-location-crosshairs mr-1" />
                      Click to locate on map
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 px-6 py-2 rounded-full border border-white/10 flex gap-8 z-20">
        <div className="flex flex-col">
          <span className="text-[8px] text-slate-500 uppercase font-black">CCTV Network</span>
          <span className="text-xs text-white font-mono tracking-tighter">
            <i className="fa-solid fa-video text-green-400 mr-1" />
            {activeCameras} ACTIVE NODES
          </span>
        </div>
        <div className="w-[1px] bg-white/10" />
        <div className="flex flex-col cursor-pointer hover:opacity-80" onClick={() => setIsNewsVisible(!isNewsVisible)}>
          <span className="text-[8px] text-slate-500 uppercase font-black">News Sentiment</span>
          <span className={`text-xs font-mono tracking-tighter ${sentimentTrend === 'Downtrend' ? 'text-red-500' : 'text-green-500'}`}>
            <i className={`fa-solid ${sentimentTrend === 'Downtrend' ? 'fa-arrow-trend-down' : 'fa-arrow-trend-up'} mr-1`} />
            {sentimentTrend.toUpperCase()}
          </span>
        </div>
        <div className="w-[1px] bg-white/10" />
        <div
          className="flex flex-col cursor-pointer hover:opacity-80"
          onClick={() => setIsIncidentsVisible(!isIncidentsVisible)}
        >
          <span className="text-[8px] text-slate-500 uppercase font-black">High Priority</span>
          <span className={`text-xs font-mono tracking-tighter ${highPriority > 5 ? 'text-red-500' : 'text-yellow-500'}`}>
            <i className="fa-solid fa-triangle-exclamation mr-1" />
            {highPriority} INCIDENTS
          </span>
        </div>
        <div className="w-[1px] bg-white/10" />
        <div className="flex flex-col">
          <span className="text-[8px] text-slate-500 uppercase font-black">Data Sources</span>
          <span className="text-xs text-cyan-400 font-mono tracking-tighter">
            <i className="fa-solid fa-database mr-1" />
            {incidents.length > 0 ? '7' : '5'} FEEDS ACTIVE
          </span>
        </div>
      </div>
    </>
  );
};

export default FloatingPanels;
