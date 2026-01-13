
import React, { useState, useEffect, useMemo } from 'react';
import { Incident, RadioStream, Camera } from '../types';
import { fetchRadioStreams, fetchIncidents, fetchCameras } from '../services/dataService';
import AudioPlayer from './AudioPlayer';
import CCTVPlayer from './CCTVPlayer';

interface SidebarProps {
  selectedCity?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedCity = 'chicago' }) => {
  const [activeTab, setActiveTab] = useState<'intel' | 'radio' | 'visuals'>('intel');
  const [radios, setRadios] = useState<RadioStream[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [currentStream, setCurrentStream] = useState<RadioStream | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);

  useEffect(() => {
    const loadData = () => {
      fetchRadioStreams(selectedCity).then(setRadios);
      fetchIncidents(selectedCity).then(setIncidents);
      fetchCameras(selectedCity).then(setCameras);
    };
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [selectedCity]);

  const sortedIncidents = useMemo(() => 
    [...incidents].sort((a, b) => b.priority - a.priority), 
  [incidents]);

  const trendingVisuals = useMemo(() => 
    [...cameras].sort((a, b) => b.viewers - a.viewers).slice(0, 8),
  [cameras]);

  return (
    <div className="w-[420px] bg-black h-full border-r border-white/10 flex flex-col z-10 font-mono">
      {/* Header with Active Intelligence Status */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-b from-slate-900 to-black">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-black text-green-500 animate-pulse uppercase">● System Active</span>
          <span className="text-[10px] text-slate-500">CORRELATION ENGINE V2.0</span>
        </div>
        <h2 className="text-xl font-black text-white tracking-tighter italic">INTEL AGGREGATOR</h2>
      </div>

      <div className="flex border-b border-white/10">
        {['intel', 'radio', 'visuals'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-green-500 text-black' : 'text-slate-500 hover:text-white'}`}
          >
            {tab === 'intel' ? 'Active Incidents' : tab === 'radio' ? 'Comms' : 'CCTV Hotspots'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {activeTab === 'intel' && (
          <div className="space-y-2">
            {sortedIncidents.map(inc => (
              <div key={inc.id} className="p-3 bg-white/5 border border-white/10 rounded group hover:border-green-500/50 transition-all cursor-crosshair">
                <div className="flex justify-between mb-1">
                  <span className={`text-[9px] font-bold px-1 rounded ${inc.priority > 80 ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                    PRIORITY: {inc.priority}
                  </span>
                  <span className="text-[9px] text-slate-500">{inc.time}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-200 group-hover:text-green-400">{inc.title}</h4>
                <p className="text-[10px] text-slate-500 mt-1 uppercase">{inc.address}</p>
                <div className="mt-2 flex gap-2">
                   <button className="text-[8px] bg-white/5 px-2 py-1 rounded hover:bg-green-500 hover:text-black font-black uppercase">Follow Incident</button>
                   <button className="text-[8px] bg-white/5 px-2 py-1 rounded hover:bg-blue-500 hover:text-black font-black uppercase">Locate Visuals</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'radio' && (
          <div className="space-y-2">
            <AudioPlayer stream={currentStream} onClose={() => setCurrentStream(null)} />
            {radios.map(radio => (
              <div 
                key={radio.id} 
                onClick={() => setCurrentStream(radio)}
                className={`p-3 border rounded cursor-pointer transition-all ${currentStream?.id === radio.id ? 'bg-green-500/20 border-green-500' : 'bg-white/5 border-white/10 hover:border-white/30'}`}
              >
                <div className="flex justify-between items-center">
                   <span className="text-xs font-bold">{radio.name}</span>
                   <span className="text-[10px] text-green-500">{radio.listeners} Watching</span>
                </div>
                <p className="text-[9px] text-slate-500 uppercase mt-1">{radio.description}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'visuals' && (
          <div className="grid grid-cols-2 gap-2">
            {trendingVisuals.map(cam => (
              <div
                key={cam.id}
                onClick={() => setSelectedCamera(cam)}
                className="relative aspect-video bg-slate-900 border border-white/10 rounded overflow-hidden group cursor-pointer hover:border-cyan-500/50 transition-all"
              >
                <img
                  src={cam.streamUrl || cam.url || `https://picsum.photos/seed/${cam.id}/300/200`}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                  alt=""
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${cam.id}/300/200` }}
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all" />
                <div className="absolute top-1 left-1 bg-red-600 px-1 rounded text-[7px] font-black text-white">LIVE</div>
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-cyan-500 px-1.5 py-0.5 rounded text-[7px] font-black text-black">
                    <i className="fa-solid fa-expand mr-1" />VIEW
                  </span>
                </div>
                <div className="absolute bottom-1 left-1 right-1">
                  <p className="text-[8px] font-black text-white truncate uppercase">{cam.name}</p>
                  <p className="text-[7px] text-green-400">{cam.viewers} PERSPECTIVES</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CCTV Video Player Modal */}
      <CCTVPlayer
        camera={selectedCamera}
        onClose={() => setSelectedCamera(null)}
        allCameras={cameras}
        onCameraChange={setSelectedCamera}
      />
    </div>
  );
};

export default Sidebar;
