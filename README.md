# 🌍 COSMIC ERA - NASA Space Apps Challenge

**Learning about Earth's fire hotspots and magnetic field, using ideas from NASA satellite data**

## 🚀 Overview

Cosmic Era is a student-built web app that shows how satellites help us watch the Earth. Explore a calendar of fire activity, a ranked list of fire-prone regions, a space-weather (Kp Index) display with an aurora forecast, and a question-and-answer helper.

> **Note:** The numbers in this app are *simulated demo data* modelled on NASA MODIS / NOAA VIIRS fire detections and NOAA space-weather measurements. Connecting live data is a planned next step.

## 📋 Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
npm install
npm run dev
```

Open http://localhost:3000

## 🌐 Deployment to Vercel

1. Push to GitHub:
```bash
git add .
git commit -m "Cosmic Era - NASA Space Apps"
git push origin main
```

2. Go to vercel.com and import your repo
3. Click "Deploy"

Your live app: `https://your-app-name.vercel.app`

## 🎨 Features

- 📡 **Satellite Calendars**: MODIS, VIIRS, and Harmonized views
- 🔥 **Hotspot Map**: 8 fire-prone regions ranked by intensity, filterable by continent
- 🧲 **Magnetic Field**: Kp Index (0-9), space-weather measurements and an aurora forecast by latitude
- 🤖 **AI Assistant**: Keyword-based Q&A over 10 written topics about hotspots and Earth science (not a large language model)

## 📁 Project Structure

- `app/` - pages and layout (Next.js App Router)
- `app/components/` - Navigation, HomePage, Dashboard and the four dashboard tabs

## 🛰️ Data Sources

Inspiration for the simulated values (not yet connected live):

- **MODIS**: NASA Terra/Aqua satellite fire detections
- **VIIRS**: NOAA/NASA Suomi NPP fire detections
- **Magnetic Field**: NOAA Space Weather Prediction Center

## 📚 Technologies

- Next.js 14 - React framework
- TypeScript - Type safety
- Tailwind CSS - Styling
- date-fns - Date utilities

## 🎓 Learning Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [NASA Earth Observation](https://earthobservatory.nasa.gov)

---

**🌍 Monitoring Earth's Vital Signs - One Hotspot at a Time 🌍**

## What's new (v2)

- **Real interactive map** (Leaflet) with NASA GIBS satellite imagery and live VIIRS fire detections. Pick any date since Feb 2024.
- **Real photos** of fire hotspots in 8 countries (Wikimedia Commons, credited) next to the NASA satellite snapshot of the same place.
- **Live magnetic field data** from NOAA Space Weather: Kp index, solar wind speed, Bz, storm scale, aurora maps and Sun images that refresh automatically.
- **Magnetosphere simulator**: an animated model of Earth's magnetic bubble being squeezed by the solar wind. Try the "Launch a solar storm" button. (Note: this is the *magnetic* field, not gravity.)
- Satellite Calendars are still simulated demo data.

## Change the colours

All colours live in `app/globals.css` in the `:root` block (`--bg-*` for backgrounds, `--accent-*` for the main colour). Change the numbers (R G B) and the whole site updates.

## Data sources

NASA GIBS (gibs.earthdata.nasa.gov), NOAA SWPC (services.swpc.noaa.gov), Wikimedia Commons (photos, with licences shown in the app).

## What's new (v3)

- **Satellites tab:** the history of MODIS (2000 to about 2027) and VIIRS (2011 onwards), a side-by-side comparison, a resolution demo, and a "time machine" comparing fires on any day since 2001 with the same day this year.
- **Fire Analysis tab:** graphs built from 25 years of MODIS fire maps (which year burned most, which months, which places), a two-region comparison, a two-country comparison (area burned, GWIS data for every country) and "this year vs previous years".
- **Explore an Area tab:** click a point, draw a box or type latitude/longitude. You get a satellite photo, today's fire activity, the same days of the year in every year since 2001, and nearby disasters.
- **Disaster Map tab:** live earthquakes (USGS), volcanoes, floods, storms and droughts (NASA EONET), disaster alerts (GDACS) and famous past events, including oil spills.
- **Magnetic Field & Core tab:** an interactive cross-section of Earth's layers showing where the magnetic field is made (the liquid outer core).
- **Early Warnings page:** live GDACS alerts, the warning systems scientists use for each hazard, and which disasters heat can and cannot cause.
- **Daily Report page:** rebuilt from live data each time it opens. It covers today's fires compared with last week, last year and the 2001–2025 average, plus earthquakes, alerts and space weather, with a written summary.
- **Colour guide:** every colour used on the maps is explained (event colours, the fire ramp, earthquake magnitude, Kp and alert levels).

### The MODIS history file (`app/lib/modis-history.json`)
Made by this project. On the 8th and 22nd of every month from January 2001 to October 2026, NASA's world map of MODIS Terra fire detections (GIBS layer `MODIS_Terra_Thermal_Anomalies_All`, 2048 × 1024 pixels) was downloaded, and the fire pixels were counted for the whole world, for the 8 hotspot regions and for every 10° × 10° square.

### More data sources
USGS Earthquake Hazards Program · NASA EONET · GDACS (UN / European Commission) · GWIS (European Commission JRC) via Our World in Data.
