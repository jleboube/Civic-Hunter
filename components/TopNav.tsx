
import React, { useState } from 'react';

const TopNav: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');

  return (
    <nav className="absolute top-0 left-0 right-0 h-14 bg-[#0b0e14]/80 backdrop-blur-xl border-b border-white/10 flex items-center px-4 justify-between z-30 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.reload()}>
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.4)] group-hover:scale-110 transition-transform">
             <i className="fa-solid fa-bullseye text-white text-lg" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-black tracking-tighter uppercase leading-none text-white">CivicWatch</h1>
            <p className="text-[8px] text-green-500 font-black tracking-[0.2em] uppercase mt-0.5">Civilian Intel</p>
          </div>
        </div>

        <div className="flex gap-2">
          {[
            { icon: 'fa-plane', color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
            { icon: 'fa-triangle-exclamation', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            { icon: 'fa-fire', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' }
          ].map((item, i) => (
            <div 
              key={i} 
              className={`${item.bg} ${item.border} border px-2.5 py-1.5 rounded-md flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all hover:-translate-y-0.5`}
            >
              <i className={`fa-solid ${item.icon} ${item.color} text-[10px]`} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-8 relative group">
        <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm group-focus-within:text-green-500 transition-colors" />
        <input 
          type="text" 
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Lookup coordinates, signals, or unit IDs..." 
          className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-11 pr-4 text-xs focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all text-slate-200 placeholder:text-slate-600 font-mono"
        />
        {searchValue && (
          <button 
            onClick={() => setSearchValue('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white"
          >
            <i className="fa-solid fa-circle-xmark" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex gap-4">
          <button className="relative text-slate-500 hover:text-white transition-colors">
            <i className="fa-solid fa-bell text-xl" />
            <span className="absolute -top-1.5 -right-1.5 bg-orange-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-[#0b0e14] shadow-lg">12</span>
          </button>
          <button className="relative text-slate-500 hover:text-white transition-colors">
            <i className="fa-solid fa-ghost text-xl" />
            <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-[#0b0e14] shadow-lg">3</span>
          </button>
        </div>
        <div className="h-6 w-[1px] bg-white/10 mx-2" />
        <button className="bg-slate-800 hover:bg-slate-700 p-2 rounded-xl border border-white/10 transition-all active:scale-95">
          <i className="fa-solid fa-shield-halved text-green-500" />
        </button>
      </div>
    </nav>
  );
};

export default TopNav;
