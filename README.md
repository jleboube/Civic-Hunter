<div align="center">

# Civic Hunter

![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=000)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=fff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=fff)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?logo=leaflet&logoColor=fff)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=fff)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?logo=googlegemini&logoColor=fff)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=fff)

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/muscl3n3rd)

A real-time OSINT intelligence platform that aggregates crime data, traffic incidents, CCTV feeds, and breaking news with AI-powered hotspot analysis.

[Features](#features) • [Quick Start](#quick-start) • [Tech Stack](#tech-stack) • [Data Sources](#data-sources)

</div>

## Overview

Civic Hunter is an open-source intelligence (OSINT) dashboard designed for situational awareness. It pulls real-time data from multiple city open data portals, visualizes incidents on an interactive map, and uses Google Gemini AI to identify emerging hotspots and correlations.

![Dashboard](docs/dashboard.png "Civic Hunter Dashboard")


## Features

- **Multi-City Intelligence**: Switch between Chicago, NYC, Los Angeles, and Washington DC
- **Real-Time Crime Tracking**: Live crime data with priority scoring and categorization
- **Interactive Map**: Leaflet-powered dark theme map with custom incident markers
- **AI Hotspot Analysis**: Gemini-powered pattern detection and threat assessment
- **Signal Intelligence Panel**: Aggregated news feed with sentiment analysis
- **Incident Alerts**: Clickable alerts that navigate to location with detail modals
- **CCTV Integration**: Live camera feeds from city DOT networks
- **Radio Scanner Streams**: Police, fire, and EMS radio feeds
- **Layer Controls**: Toggle between hotspots, incidents, and cameras
- **Auto-Refresh**: Data updates every 60 seconds


## Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling

### Mapping
- **Leaflet** - Interactive map library
- **CartoDB Dark** - Dark theme map tiles

### Backend
- **Node.js** - Runtime
- **Express** - API server
- **Google Gemini AI** - Hotspot analysis

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration


## Data Sources

### Chicago
| Source | Data Type | API |
|--------|-----------|-----|
| Chicago PD | Crime Reports (2025) | `data.cityofchicago.org` |
| Chicago DOT | Traffic Crashes | `data.cityofchicago.org` |
| Chicago 311 | Service Requests | `data.cityofchicago.org` |

### New York City
| Source | Data Type | API |
|--------|-----------|-----|
| NYC DOT | CCTV Cameras | `data.cityofnewyork.us` |
| NYC 311 | Service Requests | `data.cityofnewyork.us` |

### News & Intelligence
| Source | Data Type |
|--------|-----------|
| GDELT | Global news events |
| Simulated Feed | Breaking alerts |


## Quick Start

### Prerequisites
- Docker and Docker Compose v2
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone https://gitea.my-house.dev/joe/Civic-Hunter.git
cd Civic-Hunter
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Edit `.env` with your Gemini API key:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Start the application:
```bash
docker compose up -d --build
```

5. Access the application at: **http://localhost:47391**

### Default Port
The application runs on port **47391** by default.


## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for AI analysis | Yes |
| `PORT` | Server port (default: 47391) | No |


## Usage

### Monitoring Your City

1. Select your city from the dropdown (Chicago is default)
2. View real-time incidents on the map with color-coded markers
3. Click **Signal Intelligence** alerts to navigate to locations
4. Toggle layer controls to filter by hotspots, incidents, or cameras
5. Check the **AI Analysis** panel for threat level and hotspot summary
6. Click **High Priority Incidents** in the stats bar for critical alerts
7. Use the refresh button or wait for auto-updates


### Incident Priority Colors

| Color | Priority | Examples |
|-------|----------|----------|
| 🔴 Red | Critical (80+) | Homicide, Robbery, Arson |
| 🟠 Orange | High (60-79) | Battery, Burglary, Weapons |
| 🟡 Yellow | Medium (40-59) | Theft, Criminal Damage |
| 🔵 Blue | Low (<40) | Minor offenses |


## Project Structure

```
Civic-Hunter/
├── components/
│   ├── AudioPlayer.tsx      # Radio stream player
│   ├── FloatingPanels.tsx   # News & incident panels
│   ├── MapContainer.tsx     # Leaflet map with markers
│   ├── Sidebar.tsx          # Navigation sidebar
│   └── TopNav.tsx           # Top navigation bar
├── server/
│   └── index.js             # Express API server
├── services/
│   └── dataService.ts       # API client functions
├── App.tsx                  # Main application
├── types.ts                 # TypeScript definitions
├── index.html               # Entry HTML
├── docker-compose.yml       # Docker configuration
├── Dockerfile               # Multi-stage build
└── package.json             # Dependencies
```


## Local Development

### Without Docker

```bash
# Install dependencies
npm install

# Run development server (frontend)
npm run dev

# Run backend server (separate terminal)
node server/index.js

# Access at http://localhost:5173
```

### With Docker

```bash
docker compose up --build
# Access at http://localhost:47391
```


## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `GET /api/incidents?city=chicago` | Fetch incidents by city |
| `GET /api/cameras` | Fetch CCTV cameras |
| `GET /api/news` | Fetch news articles |
| `GET /api/radio-streams` | Get radio scanner streams |
| `POST /api/analyze-hotspots` | AI hotspot analysis |


## Disclaimer

This tool aggregates publicly available open data for situational awareness purposes only. It is not affiliated with any law enforcement agency. Data accuracy depends on source APIs. Always verify critical information through official channels.


## License

MIT License

---

[![LinkedIn](https://custom-icon-badges.demolab.com/badge/LinkedIn-0A66C2?logo=linkedin-white&logoColor=fff)](https://linkedin.com/in/joe-leboube)

2026 Copyright - Joe LeBoube
