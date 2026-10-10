'use client'
import { useState } from 'react'

const HOTSPOTS_DATA = [
  { country: 'Brazil', continent: 'S. America', intensity: 92, temp: 485, confidence: 95, lat: -10.5, lng: -55.5 },
  { country: 'Australia', continent: 'Oceania', intensity: 87, temp: 465, confidence: 92, lat: -25.2, lng: 133.8 },
  { country: 'Indonesia', continent: 'Asia', intensity: 78, temp: 445, confidence: 88, lat: -2.5, lng: 113.7 },
  { country: 'DRC', continent: 'Africa', intensity: 82, temp: 455, confidence: 91, lat: -4.5, lng: 21.8 },
  { country: 'Madagascar', continent: 'Africa', intensity: 71, temp: 420, confidence: 85, lat: -19.9, lng: 46.9 },
  { country: 'Canada', continent: 'N. America', intensity: 88, temp: 470, confidence: 93, lat: 60.5, lng: -96.0 },
  { country: 'Russia', continent: 'Europe', intensity: 79, temp: 450, confidence: 89, lat: 62.0, lng: 105.0 },
  { country: 'India', continent: 'Asia', intensity: 65, temp: 410, confidence: 82, lat: 28.5, lng: 77.2 }
]

export default function HotspotMap() {
  const [selectedHotspot, setSelectedHotspot] = useState<typeof HOTSPOTS_DATA[0] | null>(null)
  const [filteredContinent, setFilteredContinent] = useState<string>('all')

  const filtered = filteredContinent === 'all' ? HOTSPOTS_DATA : HOTSPOTS_DATA.filter(h => h.continent === filteredContinent)
  const sorted = [...filtered].sort((a, b) => b.intensity - a.intensity)

  const getIntensityColor = (intensity: number) => {
    if (intensity < 50) return '#ef6461'
    if (intensity < 75) return '#f97316'
    return '#dc2626'
  }

  const continents = ['all', ...Array.from(new Set(HOTSPOTS_DATA.map(h => h.continent)))]

  return (
    <div className="space-y-6">
      {/* Continent Filter */}
      <div className="flex gap-2 flex-wrap">
        {continents.map(continent => (
          <button
            key={continent}
            onClick={() => setFilteredContinent(continent)}
            className={`px-3 py-1 rounded text-sm ${filteredContinent === continent ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-gray-300'}`}
          >
            {continent === 'all' ? 'All Regions' : continent}
          </button>
        ))}
      </div>

      {/* Hotspot Details */}
      {selectedHotspot && (
        <div className="bg-slate-700/50 p-4 rounded border border-cyan-500/30">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-cyan-400">{selectedHotspot.country}</h3>
            <button onClick={() => setSelectedHotspot(null)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">📊 Intensity: <span className="text-red-400 font-bold">{selectedHotspot.intensity}%</span></p>
              <p className="text-sm text-gray-400">🌡️ Temperature: <span className="text-orange-400 font-bold">{selectedHotspot.temp}K</span></p>
              <p className="text-sm text-gray-400">✓ Confidence: <span className="text-green-400 font-bold">{selectedHotspot.confidence}%</span></p>
              <p className="text-sm text-gray-400">📍 Location: <span className="text-cyan-400 font-bold">{selectedHotspot.lat}°, {selectedHotspot.lng}°</span></p>
            </div>
            <div className="flex justify-center">
              <div className="h-32 w-32 rounded bg-slate-600 flex items-center justify-center text-5xl" aria-label={`Fire hotspot in ${selectedHotspot.country}`}>🔥</div>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>Country</th>
              <th>Continent</th>
              <th>Intensity</th>
              <th>Temp (K)</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((hotspot, idx) => (
              <tr key={idx} onClick={() => setSelectedHotspot(hotspot)} className="cursor-pointer hover:bg-cyan-500/10">
                <td>{hotspot.country}</td>
                <td>{hotspot.continent}</td>
                <td><span className="bg-red-600 px-2 py-1 rounded">{hotspot.intensity}%</span></td>
                <td>{hotspot.temp}K</td>
                <td>{hotspot.confidence}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-700/50 p-4 rounded text-center">
          <div className="text-2xl font-bold text-cyan-400">{filtered.length}</div>
          <div className="text-sm text-gray-400">Total Hotspots</div>
        </div>
        <div className="bg-slate-700/50 p-4 rounded text-center">
          <div className="text-2xl font-bold text-orange-400">{Math.round(filtered.reduce((a, b) => a + b.intensity, 0) / filtered.length)}%</div>
          <div className="text-sm text-gray-400">Avg Intensity</div>
        </div>
        <div className="bg-slate-700/50 p-4 rounded text-center">
          <div className="text-2xl font-bold text-green-400">{Math.round(filtered.reduce((a, b) => a + b.confidence, 0) / filtered.length)}%</div>
          <div className="text-sm text-gray-400">Avg Confidence</div>
        </div>
      </div>
    </div>
  )
}
