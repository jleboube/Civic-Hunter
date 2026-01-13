import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 47391;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files from Vite build
app.use(express.static(path.join(__dirname, '../dist')));

// Initialize Gemini AI
let genAI = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'PLACEHOLDER_API_KEY' && process.env.GEMINI_API_KEY.trim() !== '') {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// ============================================
// CCTV DATA SOURCES
// ============================================

// NYC DOT Cameras
async function fetchNYCCameras() {
  try {
    const response = await fetch('https://data.cityofnewyork.us/resource/66v9-atad.json?$limit=100', {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.log('NYC cameras API returned status:', response.status);
      return [];
    }

    const data = await response.json();

    // Validate that data is an array
    if (!Array.isArray(data)) {
      console.log('NYC cameras API did not return an array');
      return [];
    }

    return data.map((cam, index) => ({
      id: `nyc-${cam.cameraid || index}`,
      name: cam.name || `NYC Camera ${index + 1}`,
      location: cam.borough || 'New York',
      lat: parseFloat(cam.latitude) || 40.7128,
      lng: parseFloat(cam.longitude) || -74.0060,
      url: `https://webcams.nyctmc.org/multiviewer/data/${cam.cameraid}/snapshot.jpg`,
      streamUrl: cam.videourl || null,
      status: 'active',
      source: 'NYC DOT',
      viewers: Math.floor(Math.random() * 150)
    }));
  } catch (error) {
    console.error('Error fetching NYC cameras:', error.message);
    return [];
  }
}

// Chicago DOT Cameras
async function fetchChicagoCameras() {
  try {
    const response = await fetch('https://data.cityofchicago.org/resource/v4nv-qy7d.json?$limit=50', {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.log('Chicago cameras API returned status:', response.status);
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.log('Chicago cameras API did not return an array');
      return [];
    }

    return data.map((cam, index) => ({
      id: `chi-${index}`,
      name: cam.intersection || `Chicago Camera ${index + 1}`,
      location: 'Chicago, IL',
      lat: parseFloat(cam.latitude) || 41.8781,
      lng: parseFloat(cam.longitude) || -87.6298,
      url: cam.image || null,
      streamUrl: cam.video || null,
      status: 'active',
      source: 'Chicago DOT',
      viewers: Math.floor(Math.random() * 100)
    }));
  } catch (error) {
    console.error('Error fetching Chicago cameras:', error.message);
    return [];
  }
}

// 511.org California Traffic Cams (static data - always works)
async function fetchCaliforniaCameras() {
  const caltransCameras = [
    { id: 'ca-1', name: 'I-80 Bay Bridge Toll Plaza', lat: 37.8162, lng: -122.3560, location: 'San Francisco, CA' },
    { id: 'ca-2', name: 'US-101 Golden Gate Bridge', lat: 37.8199, lng: -122.4783, location: 'San Francisco, CA' },
    { id: 'ca-3', name: 'I-405 LAX Vicinity', lat: 33.9425, lng: -118.4081, location: 'Los Angeles, CA' },
    { id: 'ca-4', name: 'I-5 Downtown LA', lat: 34.0522, lng: -118.2437, location: 'Los Angeles, CA' },
    { id: 'ca-5', name: 'SR-99 Fresno', lat: 36.7378, lng: -119.7871, location: 'Fresno, CA' },
    { id: 'ca-6', name: 'I-15 San Diego', lat: 32.7157, lng: -117.1611, location: 'San Diego, CA' },
    { id: 'ca-7', name: 'I-880 Oakland', lat: 37.8044, lng: -122.2712, location: 'Oakland, CA' },
    { id: 'ca-8', name: 'US-101 San Jose', lat: 37.3382, lng: -121.8863, location: 'San Jose, CA' },
    { id: 'ca-9', name: 'I-10 Santa Monica', lat: 34.0195, lng: -118.4912, location: 'Santa Monica, CA' },
    { id: 'ca-10', name: 'I-580 Dublin', lat: 37.7022, lng: -121.9358, location: 'Dublin, CA' }
  ];

  return caltransCameras.map(cam => ({
    ...cam,
    url: null,
    streamUrl: null,
    status: 'active',
    source: 'Caltrans',
    viewers: Math.floor(Math.random() * 80) + 20
  }));
}

// DC Traffic Cameras (static data - always works)
async function fetchDCCameras() {
  const dcCameras = [
    { id: 'dc-1', name: 'Constitution Ave NW', lat: 38.8918, lng: -77.0261, location: 'Washington, DC' },
    { id: 'dc-2', name: 'Independence Ave SW', lat: 38.8871, lng: -77.0134, location: 'Washington, DC' },
    { id: 'dc-3', name: 'Pennsylvania Ave NW', lat: 38.8977, lng: -77.0365, location: 'Washington, DC' },
    { id: 'dc-4', name: 'I-395 Downtown', lat: 38.8752, lng: -77.0244, location: 'Washington, DC' },
    { id: 'dc-5', name: 'K Street NW', lat: 38.9024, lng: -77.0309, location: 'Washington, DC' },
    { id: 'dc-6', name: 'Georgetown Waterfront', lat: 38.9031, lng: -77.0654, location: 'Washington, DC' },
    { id: 'dc-7', name: 'DuPont Circle', lat: 38.9096, lng: -77.0434, location: 'Washington, DC' }
  ];

  return dcCameras.map(cam => ({
    ...cam,
    url: null,
    streamUrl: null,
    status: 'active',
    source: 'DC DOT',
    viewers: Math.floor(Math.random() * 60) + 10
  }));
}

// International CCTV feeds (static data - always works)
async function fetchInternationalCameras() {
  const internationalCams = [
    { id: 'uk-1', name: 'Trafalgar Square', lat: 51.5074, lng: -0.1278, location: 'London, UK', source: 'TfL' },
    { id: 'uk-2', name: 'Piccadilly Circus', lat: 51.5099, lng: -0.1342, location: 'London, UK', source: 'TfL' },
    { id: 'uk-3', name: 'Tower Bridge', lat: 51.5055, lng: -0.0754, location: 'London, UK', source: 'TfL' },
    { id: 'jp-1', name: 'Shibuya Crossing', lat: 35.6595, lng: 139.7004, location: 'Tokyo, Japan', source: 'Public' },
    { id: 'jp-2', name: 'Shinjuku Station', lat: 35.6896, lng: 139.7006, location: 'Tokyo, Japan', source: 'Public' },
    { id: 'de-1', name: 'Brandenburg Gate', lat: 52.5163, lng: 13.3777, location: 'Berlin, Germany', source: 'Public' },
    { id: 'fr-1', name: 'Champs-Élysées', lat: 48.8698, lng: 2.3078, location: 'Paris, France', source: 'Public' },
    { id: 'fr-2', name: 'Place de la Concorde', lat: 48.8656, lng: 2.3212, location: 'Paris, France', source: 'Public' }
  ];

  return internationalCams.map(cam => ({
    ...cam,
    url: null,
    streamUrl: null,
    status: 'active',
    viewers: Math.floor(Math.random() * 200) + 50
  }));
}

// Aggregate all CCTV sources
app.get('/api/cameras', async (req, res) => {
  try {
    const [nycCams, chicagoCams, caCams, dcCams, intlCams] = await Promise.all([
      fetchNYCCameras(),
      fetchChicagoCameras(),
      fetchCaliforniaCameras(),
      fetchDCCameras(),
      fetchInternationalCameras()
    ]);

    const allCameras = [...nycCams, ...chicagoCams, ...caCams, ...dcCams, ...intlCams];

    // Sort by viewer count (simulating trending/hot cameras)
    allCameras.sort((a, b) => b.viewers - a.viewers);

    console.log(`Cameras API: Returning ${allCameras.length} cameras`);
    res.json(allCameras);
  } catch (error) {
    console.error('Error aggregating cameras:', error);
    res.status(500).json({ error: 'Failed to fetch camera data' });
  }
});

// ============================================
// NEWS FEED SOURCES
// ============================================

// City to GDELT location mapping
const CITY_GDELT_QUERIES = {
  chicago: 'Chicago OR Illinois',
  nyc: 'New York OR Manhattan OR Brooklyn OR Queens OR Bronx',
  la: 'Los Angeles OR California OR LA',
  dc: 'Washington DC OR Capitol OR Congress',
  evansville: 'Evansville OR Indiana'
};

// GDELT Project - Real-time news filtered by location
async function fetchGDELTNews(city = null) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    // Build location-aware query
    let locationQuery = '';
    if (city && CITY_GDELT_QUERIES[city]) {
      locationQuery = `(${CITY_GDELT_QUERIES[city]})`;
    } else {
      // Default to major US cities
      locationQuery = '(Chicago OR "New York" OR "Los Angeles" OR Washington OR Illinois OR California)';
    }

    // Combine location with incident-type keywords, filter to US sources
    const query = encodeURIComponent(`${locationQuery} (incident OR emergency OR crime OR shooting OR fire OR accident OR breaking)`);
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=artlist&maxrecords=30&format=json&sourcelang=english&sourcecountry:US`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log('GDELT API returned status:', response.status);
      return [];
    }

    const text = await response.text();

    // Check if response looks like JSON
    if (!text.trim().startsWith('{') && !text.trim().startsWith('[')) {
      console.log('GDELT API did not return JSON:', text.slice(0, 100));
      return [];
    }

    const data = JSON.parse(text);

    if (data.articles && Array.isArray(data.articles)) {
      // Filter to prioritize US sources
      const usArticles = data.articles.filter(article => {
        const domain = (article.domain || '').toLowerCase();
        const country = (article.sourcecountry || '').toLowerCase();
        // Prioritize US sources
        return country.includes('united states') ||
               domain.endsWith('.com') ||
               domain.endsWith('.org') ||
               domain.endsWith('.gov') ||
               domain.includes('chicago') ||
               domain.includes('nyc') ||
               domain.includes('nytimes') ||
               domain.includes('cnn') ||
               domain.includes('abc') ||
               domain.includes('nbc') ||
               domain.includes('cbs') ||
               domain.includes('fox');
      });

      // Use filtered US articles if available, otherwise use all
      const articlesToUse = usArticles.length > 5 ? usArticles : data.articles;

      return articlesToUse.slice(0, 20).map((article, index) => ({
        id: `gdelt-${index}`,
        title: article.title || 'Breaking News',
        source: article.domain || 'GDELT',
        url: article.url,
        time: article.seendate || new Date().toISOString(),
        imageUrl: article.socialimage || null,
        sentiment: analyzeSentimentBasic(article.title),
        location: extractLocation(article.title),
        category: 'breaking',
        country: article.sourcecountry || 'Unknown'
      }));
    }
    return [];
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('GDELT API request timed out');
    } else {
      console.error('Error fetching GDELT news:', error.message);
    }
    return [];
  }
}


// Basic sentiment analysis without external API
function analyzeSentimentBasic(text) {
  if (!text) return 'neutral';

  const negativeWords = ['crash', 'accident', 'fire', 'shooting', 'emergency', 'death', 'killed', 'injured', 'explosion', 'attack', 'violence', 'danger', 'warning', 'alert', 'critical', 'severe', 'breaking'];
  const positiveWords = ['celebration', 'festival', 'success', 'achievement', 'safe', 'resolved', 'peaceful', 'improvement', 'recovery', 'community'];

  const lowerText = text.toLowerCase();
  let score = 0;

  negativeWords.forEach(word => {
    if (lowerText.includes(word)) score -= 1;
  });

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) score += 1;
  });

  if (score < -1) return 'negative';
  if (score > 1) return 'positive';
  return 'neutral';
}

// Extract location from text
function extractLocation(text) {
  if (!text) return null;

  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Washington', 'Boston', 'Nashville', 'Baltimore', 'Oklahoma City', 'Portland', 'Las Vegas', 'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento', 'Kansas City', 'Atlanta', 'Miami', 'London', 'Paris', 'Tokyo', 'Berlin', 'Brooklyn', 'Manhattan', 'Queens'];

  for (const city of cities) {
    if (text.includes(city)) {
      return city;
    }
  }
  return null;
}

// Aggregate all news sources with city filtering
app.get('/api/news', async (req, res) => {
  try {
    const city = req.query.city?.toLowerCase();
    const gdeltNews = await fetchGDELTNews(city);

    // Sort by time (most recent first)
    gdeltNews.sort((a, b) => new Date(b.time) - new Date(a.time));

    console.log(`News API: Returning ${gdeltNews.length} articles for ${city || 'all US'}`);
    res.json(gdeltNews.slice(0, 20));
  } catch (error) {
    console.error('Error aggregating news:', error);
    res.json([]);
  }
});

// ============================================
// INCIDENT DATA SOURCES
// ============================================

// NYC 311 Complaints
async function fetchNYC311Incidents() {
  try {
    const response = await fetch('https://data.cityofnewyork.us/resource/erm2-nwe9.json?$limit=50&$order=created_date%20DESC', {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.log('NYC 311 API returned status:', response.status);
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.log('NYC 311 API did not return an array');
      return [];
    }

    return data.map((incident, index) => ({
      id: `nyc311-${incident.unique_key || index}`,
      title: incident.complaint_type || 'Unknown Incident',
      description: incident.descriptor || '',
      address: `${incident.incident_address || ''}, ${incident.city || 'New York'}`,
      lat: parseFloat(incident.latitude) || null,
      lng: parseFloat(incident.longitude) || null,
      time: incident.created_date,
      source: 'NYC 311',
      category: incident.complaint_type,
      status: incident.status || 'Open',
      priority: calculatePriority(incident)
    })).filter(i => i.lat && i.lng);
  } catch (error) {
    console.error('Error fetching NYC 311:', error.message);
    return [];
  }
}

// Chicago 311 Data
async function fetchChicago311Incidents() {
  try {
    const response = await fetch('https://data.cityofchicago.org/resource/v6vf-nfxy.json?$limit=50&$order=created_date%20DESC', {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.log('Chicago 311 API returned status:', response.status);
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.log('Chicago 311 API did not return an array');
      return [];
    }

    return data.map((incident, index) => ({
      id: `chi311-${index}`,
      title: incident.sr_type || 'Incident',
      description: incident.sr_short_code || '',
      address: incident.street_address || 'Chicago, IL',
      lat: parseFloat(incident.latitude) || null,
      lng: parseFloat(incident.longitude) || null,
      time: incident.created_date,
      source: 'Chicago 311',
      category: incident.sr_type,
      status: incident.status || 'Open',
      priority: 50
    })).filter(i => i.lat && i.lng);
  } catch (error) {
    console.error('Error fetching Chicago 311:', error.message);
    return [];
  }
}

// ============================================
// CHICAGO SIGNAL INTELLIGENCE SOURCES
// ============================================

// Chicago Crime Data (2025)
async function fetchChicagoCrimes() {
  try {
    const response = await fetch('https://data.cityofchicago.org/resource/t7ek-mgzi.json?$limit=100&$order=date%20DESC', {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.log('Chicago Crimes API returned status:', response.status);
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.log('Chicago Crimes API did not return an array');
      return [];
    }

    return data.map((crime, index) => ({
      id: `chi-crime-${crime.id || index}`,
      title: crime.primary_type || 'Crime Reported',
      description: crime.description || '',
      address: crime.block || 'Chicago, IL',
      lat: parseFloat(crime.latitude) || null,
      lng: parseFloat(crime.longitude) || null,
      time: crime.date,
      source: 'Chicago PD',
      category: crime.primary_type,
      subcategory: crime.description,
      locationDescription: crime.location_description,
      arrest: crime.arrest === 'true' || crime.arrest === true,
      domestic: crime.domestic === 'true' || crime.domestic === true,
      beat: crime.beat,
      district: crime.district,
      ward: crime.ward,
      communityArea: crime.community_area,
      status: crime.arrest ? 'Arrest Made' : 'Open',
      priority: calculateChicagoCrimePriority(crime)
    })).filter(i => i.lat && i.lng);
  } catch (error) {
    console.error('Error fetching Chicago crimes:', error.message);
    return [];
  }
}

// Calculate priority for Chicago crimes
function calculateChicagoCrimePriority(crime) {
  let priority = 50;
  const type = (crime.primary_type || '').toLowerCase();
  const desc = (crime.description || '').toLowerCase();

  // Critical crimes
  const critical = ['homicide', 'criminal sexual assault', 'robbery', 'aggravated assault', 'kidnapping', 'arson'];
  const high = ['battery', 'burglary', 'motor vehicle theft', 'weapons violation', 'narcotics'];
  const medium = ['theft', 'criminal damage', 'assault', 'criminal trespass'];

  if (critical.some(c => type.includes(c) || desc.includes(c))) priority = 95;
  else if (high.some(h => type.includes(h) || desc.includes(h))) priority = 75;
  else if (medium.some(m => type.includes(m) || desc.includes(m))) priority = 55;

  // Boost for recent crimes (within last hour)
  if (crime.date) {
    const crimeTime = new Date(crime.date);
    const hourAgo = new Date(Date.now() - 3600000);
    if (crimeTime > hourAgo) priority += 10;
  }

  return Math.min(priority, 100);
}

// Chicago Traffic Crashes
async function fetchChicagoTrafficCrashes() {
  try {
    const response = await fetch('https://data.cityofchicago.org/resource/85ca-t3if.json?$limit=75&$order=crash_date%20DESC', {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.log('Chicago Traffic Crashes API returned status:', response.status);
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.log('Chicago Traffic Crashes API did not return an array');
      return [];
    }

    return data.map((crash, index) => ({
      id: `chi-crash-${crash.crash_record_id || index}`,
      title: `Traffic Crash: ${crash.first_crash_type || 'Vehicle Collision'}`,
      description: `${crash.prim_contributory_cause || 'Unknown cause'}`,
      address: crash.street_name ? `${crash.street_no || ''} ${crash.street_direction || ''} ${crash.street_name}`.trim() : 'Chicago, IL',
      lat: parseFloat(crash.latitude) || null,
      lng: parseFloat(crash.longitude) || null,
      time: crash.crash_date,
      source: 'Chicago DOT',
      category: 'Traffic Crash',
      crashType: crash.first_crash_type,
      trafficControl: crash.traffic_control_device,
      weatherCondition: crash.weather_condition,
      lightingCondition: crash.lighting_condition,
      roadCondition: crash.roadway_surface_cond,
      injuriesTotal: parseInt(crash.injuries_total) || 0,
      injuriesFatal: parseInt(crash.injuries_fatal) || 0,
      damageCategory: crash.damage,
      hitAndRun: crash.hit_and_run_i === 'Y',
      status: 'Reported',
      priority: calculateCrashPriority(crash)
    })).filter(i => i.lat && i.lng);
  } catch (error) {
    console.error('Error fetching Chicago traffic crashes:', error.message);
    return [];
  }
}

// Calculate priority for traffic crashes
function calculateCrashPriority(crash) {
  let priority = 45;

  if (parseInt(crash.injuries_fatal) > 0) priority = 100;
  else if (parseInt(crash.injuries_incapacitating) > 0) priority = 90;
  else if (parseInt(crash.injuries_total) > 2) priority = 80;
  else if (parseInt(crash.injuries_total) > 0) priority = 70;
  else if (crash.hit_and_run_i === 'Y') priority = 75;
  else if (crash.damage === 'OVER $1,500') priority = 55;

  return Math.min(priority, 100);
}

// Chicago Speed Camera Violations
async function fetchChicagoSpeedViolations() {
  try {
    const response = await fetch('https://data.cityofchicago.org/resource/hhkd-xvj4.json?$limit=50&$order=violation_date%20DESC', {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.log('Chicago Speed Camera API returned status:', response.status);
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((violation, index) => ({
      id: `chi-speed-${index}`,
      title: 'Speed Camera Violation Zone',
      description: `${violation.violations || 'Multiple'} violations recorded`,
      address: violation.address || 'Chicago, IL',
      lat: parseFloat(violation.latitude) || null,
      lng: parseFloat(violation.longitude) || null,
      time: violation.violation_date,
      source: 'Chicago Speed Cameras',
      category: 'Traffic Enforcement',
      violations: parseInt(violation.violations) || 0,
      cameraId: violation.camera_id,
      status: 'Active',
      priority: 35
    })).filter(i => i.lat && i.lng);
  } catch (error) {
    console.error('Error fetching Chicago speed violations:', error.message);
    return [];
  }
}

// Chicago Red Light Camera Violations
async function fetchChicagoRedLightViolations() {
  try {
    const response = await fetch('https://data.cityofchicago.org/resource/spqx-js37.json?$limit=50&$order=violation_date%20DESC', {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.log('Chicago Red Light Camera API returned status:', response.status);
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((violation, index) => ({
      id: `chi-redlight-${index}`,
      title: 'Red Light Violation Zone',
      description: `${violation.violations || 'Multiple'} red light violations`,
      address: violation.intersection || violation.address || 'Chicago, IL',
      lat: parseFloat(violation.latitude) || null,
      lng: parseFloat(violation.longitude) || null,
      time: violation.violation_date,
      source: 'Chicago Red Light Cameras',
      category: 'Traffic Enforcement',
      violations: parseInt(violation.violations) || 0,
      cameraId: violation.camera_id,
      status: 'Active',
      priority: 40
    })).filter(i => i.lat && i.lng);
  } catch (error) {
    console.error('Error fetching Chicago red light violations:', error.message);
    return [];
  }
}

// Chicago ShotSpotter Historical Data (gunshot detection)
async function fetchChicagoShotSpotter() {
  try {
    // Historical data - ShotSpotter was discontinued in Sept 2024
    const response = await fetch('https://data.cityofchicago.org/resource/3h7q-7mdb.json?$limit=100&$order=date%20DESC', {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.log('Chicago ShotSpotter API returned status:', response.status);
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((alert, index) => ({
      id: `chi-shot-${index}`,
      title: 'Gunshot Detection Alert',
      description: `${alert.rounds || 'Unknown'} rounds detected`,
      address: alert.block || 'Chicago, IL',
      lat: parseFloat(alert.latitude) || null,
      lng: parseFloat(alert.longitude) || null,
      time: alert.date,
      source: 'ShotSpotter (Historical)',
      category: 'Gunshot Detection',
      rounds: parseInt(alert.rounds) || 1,
      beat: alert.beat,
      district: alert.district,
      communityArea: alert.community_area,
      status: 'Historical',
      priority: 85
    })).filter(i => i.lat && i.lng);
  } catch (error) {
    console.error('Error fetching Chicago ShotSpotter:', error.message);
    return [];
  }
}

// Chicago Building Violations (safety hazards)
async function fetchChicagoBuildingViolations() {
  try {
    const response = await fetch('https://data.cityofchicago.org/resource/22u3-xenr.json?$limit=50&$order=violation_date%20DESC&violation_status=OPEN', {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.log('Chicago Building Violations API returned status:', response.status);
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((violation, index) => ({
      id: `chi-bldg-${index}`,
      title: `Building Violation: ${violation.violation_code || 'Code Violation'}`,
      description: violation.violation_description || '',
      address: violation.address || 'Chicago, IL',
      lat: parseFloat(violation.latitude) || null,
      lng: parseFloat(violation.longitude) || null,
      time: violation.violation_date,
      source: 'Chicago Buildings',
      category: 'Building Safety',
      violationCode: violation.violation_code,
      status: violation.violation_status || 'Open',
      priority: 45
    })).filter(i => i.lat && i.lng);
  } catch (error) {
    console.error('Error fetching Chicago building violations:', error.message);
    return [];
  }
}


// Calculate incident priority
function calculatePriority(incident) {
  let priority = 50;

  const criticalTerms = ['fire', 'shooting', 'weapon', 'gas leak', 'explosion', 'emergency', 'assault', 'robbery', 'collapse'];
  const highTerms = ['accident', 'injury', 'medical', 'hazard', 'dangerous'];

  const text = `${incident.complaint_type || ''} ${incident.descriptor || ''}`.toLowerCase();

  criticalTerms.forEach(term => {
    if (text.includes(term)) priority += 40;
  });

  highTerms.forEach(term => {
    if (text.includes(term)) priority += 20;
  });

  if (incident.status === 'Open') priority += 10;

  return Math.min(priority, 100);
}

// Aggregate incidents
app.get('/api/incidents', async (req, res) => {
  try {
    const city = req.query.city?.toLowerCase();

    // If city=chicago, return only Chicago data
    if (city === 'chicago') {
      const [chi311, chiCrimes, chiCrashes, chiSpeed, chiRedLight, chiShots, chiBldg] = await Promise.all([
        fetchChicago311Incidents(),
        fetchChicagoCrimes(),
        fetchChicagoTrafficCrashes(),
        fetchChicagoSpeedViolations(),
        fetchChicagoRedLightViolations(),
        fetchChicagoShotSpotter(),
        fetchChicagoBuildingViolations()
      ]);

      let allIncidents = [...chiCrimes, ...chiCrashes, ...chi311, ...chiShots, ...chiSpeed, ...chiRedLight, ...chiBldg];
      allIncidents.sort((a, b) => b.priority - a.priority);

      console.log(`Chicago Incidents API: Returning ${allIncidents.length} incidents`);
      console.log(`  - Crimes: ${chiCrimes.length}, Crashes: ${chiCrashes.length}, 311: ${chi311.length}`);
      console.log(`  - ShotSpotter: ${chiShots.length}, Speed: ${chiSpeed.length}, Red Light: ${chiRedLight.length}, Building: ${chiBldg.length}`);
      return res.json(allIncidents);
    }

    // If city=evansville, return only Evansville data
    if (city === 'evansville') {
      const [evCrimes, evShots] = await Promise.all([
        fetchEvansvilleCrimes(),
        fetchEvansvilleShotsFired()
      ]);

      let allIncidents = [...evCrimes, ...evShots];
      allIncidents.sort((a, b) => b.priority - a.priority);

      console.log(`Evansville Incidents API: Returning ${allIncidents.length} incidents`);
      console.log(`  - Crimes: ${evCrimes.length}, Shots Fired: ${evShots.length}`);
      return res.json(allIncidents);
    }

    // Default: return all cities
    const [nycIncidents, chi311, chiCrimes, chiCrashes] = await Promise.all([
      fetchNYC311Incidents(),
      fetchChicago311Incidents(),
      fetchChicagoCrimes(),
      fetchChicagoTrafficCrashes()
    ]);

    let allIncidents = [...nycIncidents, ...chiCrimes, ...chiCrashes, ...chi311];

    // Sort by priority
    allIncidents.sort((a, b) => b.priority - a.priority);

    console.log(`Incidents API: Returning ${allIncidents.length} incidents`);
    res.json(allIncidents);
  } catch (error) {
    console.error('Error aggregating incidents:', error);
    res.json([]);
  }
});

// ============================================
// CHICAGO-SPECIFIC ENDPOINTS
// ============================================

// Chicago comprehensive signal intelligence
app.get('/api/chicago/intel', async (req, res) => {
  try {
    const [crimes, crashes, incidents311, shotspotter, speedViolations, redLightViolations, buildingViolations] = await Promise.all([
      fetchChicagoCrimes(),
      fetchChicagoTrafficCrashes(),
      fetchChicago311Incidents(),
      fetchChicagoShotSpotter(),
      fetchChicagoSpeedViolations(),
      fetchChicagoRedLightViolations(),
      fetchChicagoBuildingViolations()
    ]);

    const allData = {
      crimes: crimes,
      trafficCrashes: crashes,
      serviceRequests: incidents311,
      shotspotterAlerts: shotspotter,
      speedViolations: speedViolations,
      redLightViolations: redLightViolations,
      buildingViolations: buildingViolations,
      summary: {
        totalCrimes: crimes.length,
        totalCrashes: crashes.length,
        total311: incidents311.length,
        totalShotSpotter: shotspotter.length,
        highPriorityCrimes: crimes.filter(c => c.priority >= 80).length,
        fatalCrashes: crashes.filter(c => c.injuriesFatal > 0).length,
        injuryCrashes: crashes.filter(c => c.injuriesTotal > 0).length,
        timestamp: new Date().toISOString()
      }
    };

    console.log(`Chicago Intel API: ${crimes.length} crimes, ${crashes.length} crashes, ${incidents311.length} 311 calls`);
    res.json(allData);
  } catch (error) {
    console.error('Error fetching Chicago intel:', error);
    res.status(500).json({ error: 'Failed to fetch Chicago intelligence data' });
  }
});

// Chicago crime hotspots
app.get('/api/chicago/crimes', async (req, res) => {
  try {
    const crimes = await fetchChicagoCrimes();
    console.log(`Chicago Crimes API: Returning ${crimes.length} crimes`);
    res.json(crimes);
  } catch (error) {
    console.error('Error fetching Chicago crimes:', error);
    res.status(500).json({ error: 'Failed to fetch Chicago crime data' });
  }
});

// Chicago traffic crashes
app.get('/api/chicago/crashes', async (req, res) => {
  try {
    const crashes = await fetchChicagoTrafficCrashes();
    console.log(`Chicago Crashes API: Returning ${crashes.length} crashes`);
    res.json(crashes);
  } catch (error) {
    console.error('Error fetching Chicago crashes:', error);
    res.status(500).json({ error: 'Failed to fetch Chicago crash data' });
  }
});

// Chicago ShotSpotter (historical)
app.get('/api/chicago/shotspotter', async (req, res) => {
  try {
    const alerts = await fetchChicagoShotSpotter();
    console.log(`Chicago ShotSpotter API: Returning ${alerts.length} historical alerts`);
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching Chicago ShotSpotter:', error);
    res.status(500).json({ error: 'Failed to fetch ShotSpotter data' });
  }
});

// ============================================
// EVANSVILLE, IN SIGNAL INTELLIGENCE SOURCES
// ============================================

// Evansville Crime Data (ArcGIS MapServer)
async function fetchEvansvilleCrimes() {
  try {
    // Query the last 30 days layer for more data with outSR=4326 for WGS84 coordinates
    const response = await fetch(
      'https://maps.evansvillegis.com/arcgis_server/rest/services/CRIMES/CRIMES_byDate/MapServer/1/query?where=1%3D1&outFields=*&f=json&resultRecordCount=100&outSR=4326',
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      console.log('Evansville Crimes API returned status:', response.status);
      return [];
    }

    const data = await response.json();

    if (!data.features || !Array.isArray(data.features)) {
      console.log('Evansville Crimes API did not return features array');
      return [];
    }

    return data.features.map((feature, index) => {
      const attrs = feature.attributes;
      const geom = feature.geometry;

      // With outSR=4326, geometry is already in WGS84 (lat/lng)
      let lat = null, lng = null;
      if (geom && geom.x && geom.y) {
        // ArcGIS returns x=longitude, y=latitude
        lng = geom.x;
        lat = geom.y;
      }

      return {
        id: `ev-crime-${attrs.inci_id || index}`,
        title: attrs.Map_Crime || 'Crime Reported',
        description: attrs.chrgdesc || '',
        address: attrs.Address || 'Evansville, IN',
        lat: lat,
        lng: lng,
        time: attrs.date_occu ? new Date(attrs.date_occu).toISOString() : new Date().toISOString(),
        source: 'Evansville PD',
        category: attrs.Map_Crime,
        ucrCode: attrs.ucr_code,
        zone: attrs.zone_ || attrs.zone1,
        subdivision: attrs.subdivisn,
        premise: attrs.premise,
        attemptComplete: attrs.attm_comp,
        tract: attrs.tract,
        dayOfWeek: attrs.dow1,
        hourOccurred: attrs.hour_occu,
        status: attrs.arr_chrg ? 'Arrest Charged' : 'Open',
        priority: calculateEvansvilleCrimePriority(attrs)
      };
    }).filter(i => i.lat && i.lng && !isNaN(i.lat) && !isNaN(i.lng));
  } catch (error) {
    console.error('Error fetching Evansville crimes:', error.message);
    return [];
  }
}

// Calculate priority for Evansville crimes based on Map_Crime field
function calculateEvansvilleCrimePriority(attrs) {
  let priority = 50;
  const crime = (attrs.Map_Crime || '').toLowerCase();
  const desc = (attrs.chrgdesc || '').toLowerCase();

  // Critical crimes
  const critical = ['homicide', 'murder', 'rape', 'robbery', 'kidnapping', 'arson'];
  const high = ['battery', 'burglary', 'theft', 'weapon', 'firearm', 'intimidation', 'assault'];
  const medium = ['criminal mischief', 'fraud', 'forgery', 'trespass'];

  if (critical.some(c => crime.includes(c) || desc.includes(c))) priority = 95;
  else if (high.some(h => crime.includes(h) || desc.includes(h))) priority = 75;
  else if (medium.some(m => crime.includes(m) || desc.includes(m))) priority = 55;

  return Math.min(priority, 100);
}

// Evansville Shots Fired Data (911 Calls)
async function fetchEvansvilleShotsFired() {
  try {
    // Query the last 30 days layer with outSR=4326 to get WGS84 coordinates directly
    const response = await fetch(
      'https://maps.evansvillegis.com/arcgis_server/rest/services/CRIMES/SHOTS/MapServer/1/query?where=1%3D1&outFields=*&f=json&resultRecordCount=50&outSR=4326',
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      console.log('Evansville Shots Fired API returned status:', response.status);
      return [];
    }

    const data = await response.json();

    if (!data.features || !Array.isArray(data.features)) {
      console.log('Evansville Shots Fired API did not return features array');
      return [];
    }

    return data.features.map((feature, index) => {
      const attrs = feature.attributes;
      const geom = feature.geometry;

      // With outSR=4326, geometry is already in WGS84 (lat/lng)
      let lat = null, lng = null;
      if (geom && geom.x && geom.y) {
        // ArcGIS returns x=longitude, y=latitude
        lng = geom.x;
        lat = geom.y;
      }

      return {
        id: `ev-shots-${index}`,
        title: attrs.Nature || 'Shots Fired Report',
        description: `911 call reported - ${attrs.CloseCode === 'UNF' ? 'Unfounded' : attrs.CloseCode === 'ARR' ? 'Arrest Made' : attrs.CloseCode === 'RPT' ? 'Report Filed' : 'Responded'}`,
        address: attrs.Street || 'Evansville, IN',
        lat: lat,
        lng: lng,
        time: attrs.CallTime ? new Date(attrs.CallTime).toISOString() : new Date().toISOString(),
        source: 'Evansville 911',
        category: 'Shots Fired',
        agency: attrs.Agency?.trim() || 'EPD',
        city: attrs.CityDescription || 'Evansville',
        closeCode: attrs.CloseCode?.trim(),
        district: attrs.District?.trim(),
        beat: attrs.GeoLawBeat?.trim(),
        status: attrs.CloseCode === 'ARR' ? 'Arrest' : attrs.CloseCode === 'UNF' ? 'Unfounded' : 'Responded',
        priority: 90 // Shots fired are always high priority
      };
    }).filter(i => i.lat && i.lng && !isNaN(i.lat) && !isNaN(i.lng));
  } catch (error) {
    console.error('Error fetching Evansville shots fired:', error.message);
    return [];
  }
}

// Evansville comprehensive endpoint
app.get('/api/evansville/intel', async (req, res) => {
  try {
    const [crimes, shotsFired] = await Promise.all([
      fetchEvansvilleCrimes(),
      fetchEvansvilleShotsFired()
    ]);

    const allData = {
      crimes: crimes,
      shotsFired: shotsFired,
      summary: {
        totalCrimes: crimes.length,
        totalShotsFired: shotsFired.length,
        highPriorityCrimes: crimes.filter(c => c.priority >= 80).length,
        timestamp: new Date().toISOString()
      }
    };

    console.log(`Evansville Intel API: ${crimes.length} crimes, ${shotsFired.length} shots fired reports`);
    res.json(allData);
  } catch (error) {
    console.error('Error fetching Evansville intel:', error);
    res.status(500).json({ error: 'Failed to fetch Evansville intelligence data' });
  }
});

// Evansville crimes endpoint
app.get('/api/evansville/crimes', async (req, res) => {
  try {
    const crimes = await fetchEvansvilleCrimes();
    console.log(`Evansville Crimes API: Returning ${crimes.length} crimes`);
    res.json(crimes);
  } catch (error) {
    console.error('Error fetching Evansville crimes:', error);
    res.status(500).json({ error: 'Failed to fetch Evansville crime data' });
  }
});

// Evansville shots fired endpoint
app.get('/api/evansville/shots', async (req, res) => {
  try {
    const shots = await fetchEvansvilleShotsFired();
    console.log(`Evansville Shots Fired API: Returning ${shots.length} reports`);
    res.json(shots);
  } catch (error) {
    console.error('Error fetching Evansville shots fired:', error);
    res.status(500).json({ error: 'Failed to fetch Evansville shots fired data' });
  }
});

// ============================================
// RADIO STREAMS
// ============================================

app.get('/api/radio-streams', (req, res) => {
  const city = req.query.city?.toLowerCase();

  const allStreams = [
    // Chicago Police & Fire - Priority for Chicago users
    {
      id: 'chicago-pd-zone1',
      name: 'Chicago PD Zone 1',
      description: 'CPD Zones 1-2 (Districts 1, 18)',
      location: 'Chicago, IL',
      url: 'https://broadcastify.cdnstream1.com/17635',
      type: 'police',
      city: 'chicago',
      listeners: Math.floor(Math.random() * 400) + 150
    },
    {
      id: 'chicago-pd-zone2',
      name: 'Chicago PD Zone 2',
      description: 'CPD Zones 3-4 (Districts 2, 21)',
      location: 'Chicago, IL',
      url: 'https://broadcastify.cdnstream1.com/32190',
      type: 'police',
      city: 'chicago',
      listeners: Math.floor(Math.random() * 350) + 100
    },
    {
      id: 'chicago-pd-zone5',
      name: 'Chicago PD Zone 5',
      description: 'CPD Zone 5 (Districts 7, 8)',
      location: 'Chicago, IL',
      url: 'https://broadcastify.cdnstream1.com/32193',
      type: 'police',
      city: 'chicago',
      listeners: Math.floor(Math.random() * 300) + 80
    },
    {
      id: 'chicago-pd-zone6',
      name: 'Chicago PD Zone 6',
      description: 'CPD Zone 6 (Districts 3, 6)',
      location: 'Chicago, IL',
      url: 'https://broadcastify.cdnstream1.com/32194',
      type: 'police',
      city: 'chicago',
      listeners: Math.floor(Math.random() * 280) + 90
    },
    {
      id: 'chicago-pd-zone10',
      name: 'Chicago PD Zone 10',
      description: 'CPD Zone 10 (Districts 10, 11)',
      location: 'Chicago, IL',
      url: 'https://broadcastify.cdnstream1.com/32198',
      type: 'police',
      city: 'chicago',
      listeners: Math.floor(Math.random() * 320) + 110
    },
    {
      id: 'chicago-fire-main',
      name: 'Chicago Fire Main',
      description: 'Chicago Fire Department - Main Dispatch',
      location: 'Chicago, IL',
      url: 'https://broadcastify.cdnstream1.com/17436',
      type: 'fire',
      city: 'chicago',
      listeners: Math.floor(Math.random() * 350) + 120
    },
    {
      id: 'chicago-fire-englewood',
      name: 'Chicago Fire Englewood',
      description: 'CFD Englewood Fireground',
      location: 'Chicago, IL',
      url: 'https://broadcastify.cdnstream1.com/17437',
      type: 'fire',
      city: 'chicago',
      listeners: Math.floor(Math.random() * 200) + 60
    },
    {
      id: 'chicago-ems',
      name: 'Chicago EMS',
      description: 'Chicago Emergency Medical Services',
      location: 'Chicago, IL',
      url: 'https://broadcastify.cdnstream1.com/32396',
      type: 'ems',
      city: 'chicago',
      listeners: Math.floor(Math.random() * 250) + 70
    },
    {
      id: 'cook-county-sheriff',
      name: 'Cook County Sheriff',
      description: 'Cook County Sheriff Police',
      location: 'Cook County, IL',
      url: 'https://broadcastify.cdnstream1.com/17641',
      type: 'police',
      city: 'chicago',
      listeners: Math.floor(Math.random() * 200) + 50
    },
    {
      id: 'illinois-state-police',
      name: 'Illinois State Police',
      description: 'ISP Chicago District',
      location: 'Illinois',
      url: 'https://broadcastify.cdnstream1.com/29105',
      type: 'police',
      city: 'chicago',
      listeners: Math.floor(Math.random() * 180) + 40
    },
    // NYC Streams
    {
      id: 'nypd-citywide',
      name: 'NYPD Citywide',
      description: 'New York Police Department - Citywide Operations',
      location: 'New York, NY',
      url: 'https://broadcastify.cdnstream1.com/14439',
      type: 'police',
      city: 'nyc',
      listeners: Math.floor(Math.random() * 500) + 100
    },
    {
      id: 'nypd-manhattan',
      name: 'NYPD Manhattan',
      description: 'NYPD Manhattan Dispatch',
      location: 'Manhattan, NY',
      url: 'https://broadcastify.cdnstream1.com/31728',
      type: 'police',
      city: 'nyc',
      listeners: Math.floor(Math.random() * 300) + 50
    },
    {
      id: 'fdny-citywide',
      name: 'FDNY Citywide',
      description: 'Fire Department of New York - Citywide',
      location: 'New York, NY',
      url: 'https://broadcastify.cdnstream1.com/14433',
      type: 'fire',
      city: 'nyc',
      listeners: Math.floor(Math.random() * 400) + 80
    },
    // LA Streams
    {
      id: 'la-county-fire',
      name: 'LA County Fire',
      description: 'Los Angeles County Fire Department',
      location: 'Los Angeles, CA',
      url: 'https://broadcastify.cdnstream1.com/29461',
      type: 'fire',
      city: 'la',
      listeners: Math.floor(Math.random() * 250) + 40
    },
    {
      id: 'lapd-dispatch',
      name: 'LAPD Dispatch',
      description: 'Los Angeles Police Department',
      location: 'Los Angeles, CA',
      url: 'https://broadcastify.cdnstream1.com/32982',
      type: 'police',
      city: 'la',
      listeners: Math.floor(Math.random() * 300) + 70
    }
  ];

  // Filter by city if specified
  let streams = allStreams;
  if (city === 'chicago') {
    streams = allStreams.filter(s => s.city === 'chicago');
  } else if (city) {
    streams = allStreams.filter(s => s.city === city);
  }

  res.json(streams);
});

// ============================================
// AI HOTSPOT ANALYSIS
// ============================================

app.post('/api/analyze-hotspots', async (req, res) => {
  try {
    const { incidents, cameras, news } = req.body;

    // If Gemini is available, use it for advanced analysis
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `Analyze the following OSINT data and identify potential hotspots or areas of concern.

Incidents: ${JSON.stringify(incidents?.slice(0, 10) || [])}
Camera Activity: ${JSON.stringify(cameras?.slice(0, 10) || [])}
News: ${JSON.stringify(news?.slice(0, 10) || [])}

Identify:
1. Geographic clusters of activity
2. Correlation between high viewer cameras and incidents
3. Trending locations based on news and incidents
4. Overall threat assessment (low/medium/high)

Respond in JSON format with fields: hotspots (array with lat, lng, intensity, description), correlations (array), threatLevel (string), summary (string)`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Try to parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          return res.json(analysis);
        }
      } catch (geminiError) {
        console.log('Gemini analysis failed, using algorithmic fallback:', geminiError.message);
      }
    }

    // Fallback to algorithmic analysis
    const hotspots = performAlgorithmicAnalysis(incidents || [], cameras || [], news || []);
    res.json(hotspots);

  } catch (error) {
    console.error('Error analyzing hotspots:', error);

    // Return fallback analysis
    res.json(performAlgorithmicAnalysis(
      req.body?.incidents || [],
      req.body?.cameras || [],
      req.body?.news || []
    ));
  }
});

// Algorithmic hotspot analysis
function performAlgorithmicAnalysis(incidents, cameras, news) {
  const hotspots = [];
  const locationClusters = {};

  // Cluster incidents by approximate location
  if (Array.isArray(incidents)) {
    incidents.forEach(incident => {
      if (incident && incident.lat && incident.lng) {
        const key = `${Math.round(incident.lat * 10) / 10},${Math.round(incident.lng * 10) / 10}`;
        if (!locationClusters[key]) {
          locationClusters[key] = {
            incidents: [],
            cameras: [],
            lat: incident.lat,
            lng: incident.lng,
            totalPriority: 0
          };
        }
        locationClusters[key].incidents.push(incident);
        locationClusters[key].totalPriority += incident.priority || 50;
      }
    });
  }

  // Add camera hotspots based on viewer count
  if (Array.isArray(cameras)) {
    cameras.forEach(camera => {
      if (camera && camera.lat && camera.lng && camera.viewers > 50) {
        const key = `${Math.round(camera.lat * 10) / 10},${Math.round(camera.lng * 10) / 10}`;
        if (!locationClusters[key]) {
          locationClusters[key] = {
            incidents: [],
            cameras: [],
            lat: camera.lat,
            lng: camera.lng,
            totalPriority: 0
          };
        }
        locationClusters[key].cameras.push(camera);
        locationClusters[key].totalPriority += camera.viewers;
      }
    });
  }

  // Convert clusters to hotspots
  Object.values(locationClusters).forEach(cluster => {
    const intensity = Math.min(100, cluster.totalPriority / (cluster.incidents.length + cluster.cameras.length + 1));

    if (intensity > 30) {
      hotspots.push({
        lat: cluster.lat,
        lng: cluster.lng,
        intensity: intensity,
        incidentCount: cluster.incidents.length,
        cameraCount: cluster.cameras.length,
        description: `${cluster.incidents.length} incidents, ${cluster.cameras.length} active cameras`,
        topIncident: cluster.incidents[0]?.title || 'High camera activity'
      });
    }
  });

  // Sort by intensity
  hotspots.sort((a, b) => b.intensity - a.intensity);

  // Calculate overall threat level
  const avgIntensity = hotspots.length > 0
    ? hotspots.reduce((sum, h) => sum + h.intensity, 0) / hotspots.length
    : 0;

  let threatLevel = 'low';
  if (avgIntensity > 70) threatLevel = 'high';
  else if (avgIntensity > 40) threatLevel = 'medium';

  // Find correlations
  const correlations = [];
  hotspots.slice(0, 5).forEach(hotspot => {
    if (hotspot.incidentCount > 0 && hotspot.cameraCount > 0) {
      correlations.push({
        type: 'incident-camera',
        description: `High correlation: ${hotspot.incidentCount} incidents near ${hotspot.cameraCount} trending cameras`,
        location: { lat: hotspot.lat, lng: hotspot.lng }
      });
    }
  });

  return {
    hotspots: hotspots.slice(0, 20),
    correlations,
    threatLevel,
    summary: `Identified ${hotspots.length} potential hotspots. Overall threat level: ${threatLevel}. ${correlations.length} correlations found between camera activity and incidents.`,
    analyzedAt: new Date().toISOString()
  };
}

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      api: 'up',
      gemini: genAI ? 'configured' : 'not configured'
    },
    version: '1.0.0'
  });
});

// Catch-all handler for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CivicWatch OSINT Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🤖 Gemini AI: ${genAI ? 'Enabled' : 'Disabled (no API key)'}`);
});
