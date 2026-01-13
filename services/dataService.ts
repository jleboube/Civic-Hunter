
import { Incident, RadioStream, Camera, NewsArticle, Hotspot, AnalysisResult } from '../types';

// API base URL - uses relative path in production, localhost in dev
const API_BASE = import.meta.env.DEV ? 'http://localhost:47391/api' : '/api';

/**
 * Fetch all aggregated CCTV camera feeds from multiple sources
 * Sources: NYC DOT, Chicago DOT, Caltrans, DC DOT, International
 * @param city - Optional city filter
 */
export const fetchCameras = async (city?: string): Promise<Camera[]> => {
  try {
    const url = city ? `${API_BASE}/cameras?city=${city}` : `${API_BASE}/cameras`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch cameras');
    return await response.json();
  } catch (error) {
    console.error('Camera feed error:', error);
    // Fallback to direct NYC API if backend is down
    return fetchNYCCamerasFallback();
  }
};

const fetchNYCCamerasFallback = async (): Promise<Camera[]> => {
  try {
    const response = await fetch('https://data.cityofnewyork.us/resource/66v9-atad.json?$limit=50');
    const data = await response.json();
    return data.map((cam: any) => ({
      id: cam.cam_id,
      name: cam.location,
      url: `https://webcams.nyctmc.org/google_popup.php?cid=${cam.cam_id}`,
      streamUrl: `https://webcams.nyctmc.org/multiviewer/data/${cam.cam_id}.jpg?v=${Date.now()}`,
      location: cam.borough,
      status: 'active',
      lat: parseFloat(cam.latitude),
      lng: parseFloat(cam.longitude),
      viewers: Math.floor(Math.random() * 80),
      source: 'NYC DOT'
    }));
  } catch {
    return [];
  }
};

/**
 * Fetch incident data from 311 services and crime data
 * @param city - Optional city filter (chicago, nyc, la, dc)
 */
export const fetchIncidents = async (city?: string): Promise<Incident[]> => {
  try {
    const url = city ? `${API_BASE}/incidents?city=${city}` : `${API_BASE}/incidents`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch incidents');
    const data = await response.json();
    return data.map((item: any) => ({
      ...item,
      time: new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: item.category || determineCategory(item.title)
    }));
  } catch (error) {
    console.error('Incident feed error:', error);
    return city === 'chicago' ? fetchChicagoFallback() : fetchNYC311Fallback();
  }
};

const fetchChicagoFallback = async (): Promise<Incident[]> => {
  try {
    const response = await fetch('https://data.cityofchicago.org/resource/t7ek-mgzi.json?$limit=30&$order=date%20DESC');
    const data = await response.json();
    return data.map((item: any) => ({
      id: item.id,
      title: item.primary_type,
      description: item.description,
      address: item.block || 'Chicago, IL',
      lat: parseFloat(item.latitude) || 41.8781,
      lng: parseFloat(item.longitude) || -87.6298,
      time: new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'Chicago PD',
      category: item.primary_type,
      priority: calculateChicagoCrimePriority(item)
    })).filter((i: any) => i.lat && i.lng);
  } catch {
    return [];
  }
};

const calculateChicagoCrimePriority = (crime: any): number => {
  let priority = 50;
  const type = (crime.primary_type || '').toLowerCase();
  const critical = ['homicide', 'criminal sexual assault', 'robbery', 'kidnapping', 'arson'];
  const high = ['battery', 'burglary', 'motor vehicle theft', 'weapons violation'];

  if (critical.some(c => type.includes(c))) priority = 95;
  else if (high.some(h => type.includes(h))) priority = 75;

  return Math.min(priority, 100);
};

const fetchNYC311Fallback = async (): Promise<Incident[]> => {
  try {
    const response = await fetch('https://data.cityofnewyork.us/resource/erm2-nwe9.json?$limit=20&$order=created_date DESC');
    const data = await response.json();
    return data.map((item: any) => ({
      id: item.unique_key,
      title: item.complaint_type,
      address: item.incident_address || item.intersection_street_1 || 'Unknown Location',
      lat: parseFloat(item.latitude) || 40.7128,
      lng: parseFloat(item.longitude) || -74.0060,
      time: new Date(item.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'NYC 311',
      category: determineCategory(item.complaint_type),
      descriptor: item.descriptor,
      priority: calculatePriority(item)
    }));
  } catch {
    return [];
  }
};

/**
 * Fetch radio scanner streams
 * @param city - Optional city filter
 */
export const fetchRadioStreams = async (city?: string): Promise<RadioStream[]> => {
  try {
    const url = city ? `${API_BASE}/radio-streams?city=${city}` : `${API_BASE}/radio-streams`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch radio streams');
    return await response.json();
  } catch (error) {
    console.error('Radio stream error:', error);
    return [];
  }
};

/**
 * Fetch breaking news from multiple sources
 * Sources: GDELT Project
 */
export const fetchNews = async (): Promise<NewsArticle[]> => {
  try {
    const response = await fetch(`${API_BASE}/news`);
    if (!response.ok) throw new Error('Failed to fetch news');
    const data = await response.json();
    return data.map((article: any) => ({
      ...article,
      time: formatTimeAgo(article.time)
    }));
  } catch (error) {
    console.error('News feed error:', error);
    return [];
  }
};

/**
 * Perform AI-powered hotspot analysis
 */
export const analyzeHotspots = async (
  incidents: Incident[],
  cameras: Camera[],
  news: NewsArticle[]
): Promise<AnalysisResult> => {
  try {
    const response = await fetch(`${API_BASE}/analyze-hotspots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incidents, cameras, news })
    });
    if (!response.ok) throw new Error('Failed to analyze hotspots');
    return await response.json();
  } catch (error) {
    console.error('Hotspot analysis error:', error);
    // Return basic analysis
    return performLocalAnalysis(incidents, cameras);
  }
};

// Local fallback analysis
const performLocalAnalysis = (incidents: Incident[], cameras: Camera[]): AnalysisResult => {
  const hotspots: Hotspot[] = [];

  // Group incidents by approximate location
  const clusters: Record<string, { incidents: Incident[], cameras: Camera[], lat: number, lng: number }> = {};

  incidents.forEach(inc => {
    if (inc.lat && inc.lng) {
      const key = `${Math.round(inc.lat * 10) / 10},${Math.round(inc.lng * 10) / 10}`;
      if (!clusters[key]) {
        clusters[key] = { incidents: [], cameras: [], lat: inc.lat, lng: inc.lng };
      }
      clusters[key].incidents.push(inc);
    }
  });

  cameras.filter(c => c.viewers > 50).forEach(cam => {
    if (cam.lat && cam.lng) {
      const key = `${Math.round(cam.lat * 10) / 10},${Math.round(cam.lng * 10) / 10}`;
      if (!clusters[key]) {
        clusters[key] = { incidents: [], cameras: [], lat: cam.lat, lng: cam.lng };
      }
      clusters[key].cameras.push(cam);
    }
  });

  Object.values(clusters).forEach(cluster => {
    const intensity = Math.min(100, (cluster.incidents.length * 20) + (cluster.cameras.length * 10));
    if (intensity > 20) {
      hotspots.push({
        lat: cluster.lat,
        lng: cluster.lng,
        intensity,
        description: `${cluster.incidents.length} incidents, ${cluster.cameras.length} trending cameras`,
        incidentCount: cluster.incidents.length,
        cameraCount: cluster.cameras.length
      });
    }
  });

  hotspots.sort((a, b) => b.intensity - a.intensity);

  return {
    hotspots: hotspots.slice(0, 15),
    correlations: [],
    threatLevel: hotspots.length > 5 ? 'medium' : 'low',
    summary: `Identified ${hotspots.length} potential hotspots based on incident and camera activity.`,
    analyzedAt: new Date().toISOString()
  };
};

// Helper functions
const determineCategory = (type: string): string => {
  if (!type) return 'other';
  const t = type.toLowerCase();
  if (t.includes('fire') || t.includes('smoke')) return 'fire';
  if (t.includes('police') || t.includes('assault') || t.includes('shooting') || t.includes('illegal')) return 'police';
  if (t.includes('traffic') || t.includes('accident') || t.includes('vehicle')) return 'traffic';
  if (t.includes('medical') || t.includes('ambulance')) return 'medical';
  if (t.includes('utility') || t.includes('electric') || t.includes('gas')) return 'utility';
  return 'other';
};

const calculatePriority = (item: any): number => {
  let score = 50;
  const criticalTerms = ['fire', 'shooting', 'weapon', 'gas leak', 'explosion', 'emergency', 'assault'];
  const t = (item.complaint_type || '').toLowerCase();
  const d = (item.descriptor || '').toLowerCase();

  if (criticalTerms.some(term => t.includes(term) || d.includes(term))) score += 40;
  if (item.status === 'Open') score += 10;
  return Math.min(score, 100);
};

const formatTimeAgo = (dateString: string): string => {
  if (!dateString) return 'Unknown';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};
