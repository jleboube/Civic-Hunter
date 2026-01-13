
import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Incident, Camera, Hotspot, AnalysisResult } from '../types';
import { fetchIncidents, fetchCameras, analyzeHotspots, fetchNews } from '../services/dataService';

// Exposed methods for parent components
export interface MapContainerRef {
  panTo: (lat: number, lng: number, zoom?: number) => void;
}

// Leaflet CSS import
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

// City coordinates
const CITY_CENTERS: Record<string, { lat: number; lng: number; zoom: number; name: string }> = {
  chicago: { lat: 41.8781, lng: -87.6298, zoom: 11, name: 'Chicago, IL' },
  evansville: { lat: 37.9716, lng: -87.5711, zoom: 12, name: 'Evansville, IN' },
  nyc: { lat: 40.7128, lng: -74.0060, zoom: 11, name: 'New York, NY' },
  la: { lat: 34.0522, lng: -118.2437, zoom: 10, name: 'Los Angeles, CA' },
  dc: { lat: 38.9072, lng: -77.0369, zoom: 12, name: 'Washington, DC' }
};

interface MapContainerProps {
  onIncidentSelect?: (incident: Incident) => void;
  onCameraSelect?: (camera: Camera) => void;
  onCityChange?: (city: string) => void;
}

const MapContainer = forwardRef<MapContainerRef, MapContainerProps>(({ onIncidentSelect, onCameraSelect, onCityChange }, ref) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersLayer = useRef<any>(null);
  const hotspotsLayer = useRef<any>(null);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [showLayer, setShowLayer] = useState<'incidents' | 'cameras' | 'hotspots' | 'all'>('all');
  const [selectedCity, setSelectedCity] = useState<string>('chicago');

  // Expose panTo method to parent components
  useImperativeHandle(ref, () => ({
    panTo: (lat: number, lng: number, zoom: number = 14) => {
      if (leafletMap.current) {
        leafletMap.current.setView([lat, lng], zoom, { animate: true });
      }
    }
  }));

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      // Add CSS
      if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = LEAFLET_CSS;
        document.head.appendChild(link);
      }

      // Add JS
      if (!(window as any).L) {
        const script = document.createElement('script');
        script.src = LEAFLET_JS;
        script.onload = () => setLeafletLoaded(true);
        document.head.appendChild(script);
      } else {
        setLeafletLoaded(true);
      }
    };

    loadLeaflet();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || leafletMap.current) return;

    const L = (window as any).L;
    const cityCenter = CITY_CENTERS[selectedCity] || CITY_CENTERS.chicago;

    // Create map centered on selected city (default: Chicago)
    leafletMap.current = L.map(mapRef.current, {
      center: [cityCenter.lat, cityCenter.lng],
      zoom: cityCenter.zoom,
      zoomControl: false,
      attributionControl: false
    });

    // Dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(leafletMap.current);

    // Create layer groups
    markersLayer.current = L.layerGroup().addTo(leafletMap.current);
    hotspotsLayer.current = L.layerGroup().addTo(leafletMap.current);

    // Add zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(leafletMap.current);

    // Load data
    loadData();

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [leafletLoaded]);

  // Handle city change
  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    const cityCenter = CITY_CENTERS[city];
    if (leafletMap.current && cityCenter) {
      leafletMap.current.setView([cityCenter.lat, cityCenter.lng], cityCenter.zoom);
      loadData();
    }
    // Notify parent of city change
    onCityChange?.(city);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [incidentData, cameraData, newsData] = await Promise.all([
        fetchIncidents(selectedCity),
        fetchCameras(),
        fetchNews()
      ]);

      setIncidents(incidentData);
      setCameras(cameraData);

      // Run AI analysis
      const analysisResult = await analyzeHotspots(incidentData, cameraData, newsData);
      setAnalysis(analysisResult);
      setHotspots(analysisResult.hotspots);

      // Update map markers
      if (leafletMap.current) {
        updateMapMarkers(incidentData, cameraData, analysisResult.hotspots);
      }
    } catch (error) {
      console.error('Error loading map data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMapMarkers = (incidentData: Incident[], cameraData: Camera[], hotspotData: Hotspot[]) => {
    const L = (window as any).L;
    if (!L || !markersLayer.current || !hotspotsLayer.current) return;

    markersLayer.current.clearLayers();
    hotspotsLayer.current.clearLayers();

    // Add hotspot circles
    if (showLayer === 'hotspots' || showLayer === 'all') {
      hotspotData.forEach(hotspot => {
        const intensity = hotspot.intensity / 100;
        const color = intensity > 0.7 ? '#ef4444' : intensity > 0.4 ? '#f59e0b' : '#22c55e';

        const circle = L.circle([hotspot.lat, hotspot.lng], {
          color: color,
          fillColor: color,
          fillOpacity: 0.3,
          radius: 500 + (hotspot.intensity * 20),
          weight: 2
        });

        circle.bindPopup(`
          <div class="p-2 text-sm">
            <div class="font-bold text-${intensity > 0.7 ? 'red' : intensity > 0.4 ? 'yellow' : 'green'}-500">
              Hotspot: ${Math.round(hotspot.intensity)}% Activity
            </div>
            <div class="text-gray-600">${hotspot.description}</div>
          </div>
        `);

        hotspotsLayer.current.addLayer(circle);
      });
    }

    // Add incident markers
    if (showLayer === 'incidents' || showLayer === 'all') {
      incidentData.forEach(incident => {
        if (!incident.lat || !incident.lng) return;

        const iconColor = getCategoryColor(incident.category);
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            background: ${iconColor};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <i class="fa-solid ${getCategoryIcon(incident.category)}" style="color: white; font-size: 10px;"></i>
          </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([incident.lat, incident.lng], { icon });

        marker.bindPopup(`
          <div class="p-2 min-w-[200px]">
            <div class="font-bold text-sm">${incident.title}</div>
            <div class="text-xs text-gray-500 mt-1">${incident.address}</div>
            <div class="text-xs text-gray-400 mt-1">${incident.time} | ${incident.source}</div>
            <div class="mt-2 flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-xs" style="background: ${iconColor}20; color: ${iconColor}">
                Priority: ${incident.priority}
              </span>
            </div>
          </div>
        `);

        marker.on('click', () => onIncidentSelect?.(incident));
        markersLayer.current.addLayer(marker);
      });
    }

    // Add camera markers
    if (showLayer === 'cameras' || showLayer === 'all') {
      cameraData.forEach(camera => {
        if (!camera.lat || !camera.lng) return;

        const viewerIntensity = camera.viewers > 100 ? 'high' : camera.viewers > 50 ? 'medium' : 'low';
        const camColor = viewerIntensity === 'high' ? '#ef4444' : viewerIntensity === 'medium' ? '#f59e0b' : '#3b82f6';

        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            background: ${camColor};
            width: 20px;
            height: 20px;
            border-radius: 4px;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <i class="fa-solid fa-video" style="color: white; font-size: 8px;"></i>
          </div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const marker = L.marker([camera.lat, camera.lng], { icon });

        marker.bindPopup(`
          <div class="p-2 min-w-[200px]">
            <div class="font-bold text-sm">${camera.name}</div>
            <div class="text-xs text-gray-500 mt-1">${camera.location}</div>
            <div class="flex items-center gap-2 mt-2">
              <span class="text-xs"><i class="fa-solid fa-eye"></i> ${camera.viewers} viewers</span>
              <span class="text-xs text-gray-400">${camera.source || 'CCTV'}</span>
            </div>
            ${camera.streamUrl ? `<img src="${camera.streamUrl}" class="mt-2 rounded w-full" alt="Camera feed" />` : ''}
          </div>
        `);

        marker.on('click', () => onCameraSelect?.(camera));
        markersLayer.current.addLayer(marker);
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const cat = (category || '').toLowerCase();
    const colors: Record<string, string> = {
      // Emergency/Fire
      fire: '#ef4444',
      arson: '#ef4444',
      // Police/Crime - Critical
      homicide: '#dc2626',
      'criminal sexual assault': '#dc2626',
      robbery: '#b91c1c',
      'aggravated assault': '#b91c1c',
      kidnapping: '#dc2626',
      // Police/Crime - High
      battery: '#f97316',
      burglary: '#ea580c',
      'motor vehicle theft': '#f59e0b',
      'weapons violation': '#dc2626',
      narcotics: '#a855f7',
      // Police/Crime - Medium
      theft: '#eab308',
      'criminal damage': '#f59e0b',
      assault: '#f97316',
      'criminal trespass': '#84cc16',
      // Traffic
      traffic: '#f59e0b',
      'traffic crash': '#f59e0b',
      'traffic enforcement': '#fbbf24',
      // Gunshot
      'gunshot detection': '#dc2626',
      // Building Safety
      'building safety': '#8b5cf6',
      // Service/Utility
      utility: '#8b5cf6',
      // Medical
      medical: '#22c55e',
      // Default
      police: '#3b82f6',
      other: '#6b7280'
    };
    return colors[cat] || colors.other;
  };

  const getCategoryIcon = (category: string) => {
    const cat = (category || '').toLowerCase();
    const icons: Record<string, string> = {
      // Emergency/Fire
      fire: 'fa-fire',
      arson: 'fa-fire-flame-curved',
      // Crime Icons
      homicide: 'fa-skull',
      'criminal sexual assault': 'fa-user-shield',
      robbery: 'fa-mask',
      'aggravated assault': 'fa-hand-fist',
      kidnapping: 'fa-person-walking-arrow-right',
      battery: 'fa-hand-back-fist',
      burglary: 'fa-house-crack',
      'motor vehicle theft': 'fa-car',
      'weapons violation': 'fa-gun',
      narcotics: 'fa-pills',
      theft: 'fa-bag-shopping',
      'criminal damage': 'fa-hammer',
      assault: 'fa-person-falling-burst',
      'criminal trespass': 'fa-ban',
      // Traffic
      traffic: 'fa-car-burst',
      'traffic crash': 'fa-car-burst',
      'traffic enforcement': 'fa-traffic-light',
      // Gunshot
      'gunshot detection': 'fa-crosshairs',
      // Building Safety
      'building safety': 'fa-building',
      // Service/Utility
      utility: 'fa-bolt',
      medical: 'fa-heart-pulse',
      police: 'fa-shield-halved',
      other: 'fa-circle-exclamation'
    };
    return icons[cat] || icons.other;
  };

  // Re-render markers when layer filter changes
  useEffect(() => {
    if (leafletMap.current && incidents.length > 0) {
      updateMapMarkers(incidents, cameras, hotspots);
    }
  }, [showLayer]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full bg-[#0a0f1a]">
      {/* Map Container */}
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="flex items-center gap-3 bg-black/80 px-4 py-2 rounded-lg border border-white/10">
            <div className="animate-spin w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full" />
            <span className="text-cyan-400 text-sm">Loading OSINT data...</span>
          </div>
        </div>
      )}

      {/* City Selector */}
      <div className="absolute top-4 left-4 z-10">
        <select
          value={selectedCity}
          onChange={(e) => handleCityChange(e.target.value)}
          className="bg-black/80 backdrop-blur-sm text-white text-sm px-3 py-2 rounded-lg border border-cyan-500/50 focus:border-cyan-400 focus:outline-none cursor-pointer mb-2 w-full"
        >
          <option value="chicago">Chicago, IL</option>
          <option value="evansville">Evansville, IN</option>
          <option value="nyc">New York, NY</option>
          <option value="la">Los Angeles, CA</option>
          <option value="dc">Washington, DC</option>
        </select>

        {/* Layer Controls */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowLayer('all')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              showLayer === 'all' ? 'bg-cyan-500 text-white' : 'bg-black/60 text-gray-300 hover:bg-black/80'
            }`}
          >
            <i className="fa-solid fa-layer-group mr-1" /> All Layers
          </button>
          <button
            onClick={() => setShowLayer('hotspots')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              showLayer === 'hotspots' ? 'bg-red-500 text-white' : 'bg-black/60 text-gray-300 hover:bg-black/80'
            }`}
          >
            <i className="fa-solid fa-fire mr-1" /> Hotspots
          </button>
          <button
            onClick={() => setShowLayer('incidents')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              showLayer === 'incidents' ? 'bg-blue-500 text-white' : 'bg-black/60 text-gray-300 hover:bg-black/80'
            }`}
          >
            <i className="fa-solid fa-triangle-exclamation mr-1" /> Incidents
          </button>
          <button
            onClick={() => setShowLayer('cameras')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              showLayer === 'cameras' ? 'bg-green-500 text-white' : 'bg-black/60 text-gray-300 hover:bg-black/80'
            }`}
          >
            <i className="fa-solid fa-video mr-1" /> Cameras
          </button>
        </div>
      </div>

      {/* Analysis Summary Panel - positioned above stats bar */}
      {analysis && (
        <div className="absolute bottom-20 left-4 bg-black/80 backdrop-blur-sm rounded-lg border border-white/10 p-3 max-w-sm z-10">
          <div className="flex items-center gap-2 mb-2">
            <i className="fa-solid fa-brain text-cyan-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">AI Analysis</span>
            <span className={`ml-auto px-2 py-0.5 rounded text-xs font-bold ${
              analysis.threatLevel === 'high' ? 'bg-red-500/20 text-red-400' :
              analysis.threatLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              {analysis.threatLevel.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed max-h-32 overflow-y-auto">{analysis.summary}</p>
          <div className="flex gap-4 mt-2 text-xs text-gray-400">
            <span><i className="fa-solid fa-fire-flame-curved text-red-400 mr-1" /> {hotspots.length} hotspots</span>
            <span><i className="fa-solid fa-triangle-exclamation text-blue-400 mr-1" /> {incidents.length} incidents</span>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={loadData}
        disabled={isLoading}
        className="absolute top-4 right-16 bg-black/60 backdrop-blur-sm p-2 rounded border border-white/10 text-white hover:bg-white/10 disabled:opacity-50 z-10"
      >
        <i className={`fa-solid fa-arrows-rotate ${isLoading ? 'animate-spin' : ''}`} />
      </button>

      {/* Stats Bar */}
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded border border-white/10 px-3 py-1.5 z-10">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-400">
            <i className="fa-solid fa-video text-green-400 mr-1" />
            {cameras.length} cams
          </span>
          <span className="text-gray-400">
            <i className="fa-solid fa-circle-exclamation text-yellow-400 mr-1" />
            {incidents.length} active
          </span>
        </div>
      </div>
    </div>
  );
});

MapContainer.displayName = 'MapContainer';

export default MapContainer;
