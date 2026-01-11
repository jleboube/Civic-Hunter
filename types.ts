
export interface Incident {
  id: string;
  title: string;
  address: string;
  lat: number;
  lng: number;
  time: string;
  source: string;
  category: 'medical' | 'vehicle' | 'police' | 'fire' | 'utility' | 'traffic' | 'other';
  descriptor?: string;
  priority: number;
  status?: string;
  description?: string;
}

export interface RadioStream {
  id: string;
  name: string;
  description: string;
  location: string;
  listeners: number;
  url: string;
  type: string;
}

export interface Camera {
  id: string;
  name: string;
  url: string;
  streamUrl?: string;
  location: string;
  status: string;
  lat?: number;
  lng?: number;
  viewers: number;
  source?: string;
}

export interface NewsArticle {
  id?: string;
  title: string;
  source: string;
  time: string;
  imageUrl?: string;
  link?: string;
  url?: string;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'Positive' | 'Negative' | 'Neutral';
  category?: string;
  location?: string;
}

export interface Hotspot {
  lat: number;
  lng: number;
  intensity: number;
  description: string;
  incidentCount?: number;
  cameraCount?: number;
  topIncident?: string;
}

export interface Correlation {
  type: string;
  description: string;
  location?: { lat: number; lng: number };
}

export interface AnalysisResult {
  hotspots: Hotspot[];
  correlations: Correlation[];
  threatLevel: 'low' | 'medium' | 'high';
  summary: string;
  analyzedAt: string;
}
