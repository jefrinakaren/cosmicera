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
