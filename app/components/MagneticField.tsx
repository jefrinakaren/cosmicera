'use client'
import { useState, useEffect } from 'react'

export default function MagneticField() {
  const [kpIndex, setKpIndex] = useState(3)
  const [metrics, setMetrics] = useState({
    aIndex: 15,
    solarWind: 380,
    particleDensity: 3.5,
    imf: 6.2,
    stormStatus: 'Unsettled',
    sunActivity: 'Active'
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setKpIndex(Math.floor(Math.random() * 10))
      setMetrics({
        aIndex: Math.floor(Math.random() * 50) + 5,
        solarWind: Math.floor(Math.random() * 150) + 300,
        particleDensity: Math.random() * 5 + 1,
        imf: Math.random() * 8 + 3,
        stormStatus: ['Quiet', 'Unsettled', 'Active', 'Minor Storm'][Math.floor(Math.random() * 4)],
        sunActivity: Math.random() > 0.5 ? 'Active' : 'Very Active'
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const getKpColor = (kp: number) => {
    if (kp < 2) return 'text-green-500'
    if (kp < 4) return 'text-cyan-500'
    if (kp < 6) return 'text-yellow-500'
    if (kp < 8) return 'text-orange-500'
    return 'text-red-500'
  }

  const getKpBg = (kp: number) => {
    if (kp < 2) return 'bg-green-900'
    if (kp < 4) return 'bg-cyan-900'
    if (kp < 6) return 'bg-yellow-900'
    if (kp < 8) return 'bg-orange-900'
    return 'bg-red-900'
  }

  return (
    <div className="space-y-6">
      {/* Main Kp Display */}
      <div className={`${getKpBg(kpIndex)} p-8 rounded-lg border-2 border-cyan-500/50 text-center animate-glow`}>
        <p className="text-gray-400 mb-2">Planetary Geomagnetic Activity</p>
        <div className={`text-7xl font-bold ${getKpColor(kpIndex)}`}>{kpIndex}</div>
        <p className="text-gray-400 mt-2">Kp Index (0-9 Scale)</p>
      </div>

      {/* Kp Scale Bar */}
      <div className="space-y-2">
        <p className="text-sm text-gray-400">Activity Level:</p>
        <div className="flex gap-1 h-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 rounded transition ${i <= kpIndex ? 'ring-2 ring-cyan-400' : ''} ${
                i < 2 ? 'bg-green-600' : i < 4 ? 'bg-cyan-600' : i < 6 ? 'bg-yellow-600' : i < 8 ? 'bg-orange-600' : 'bg-red-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-700/50 p-4 rounded">
          <p className="text-gray-400 text-sm mb-2">A-Index (24h avg)</p>
          <div className="flex justify-between items-end mb-2">
            <span className="text-2xl font-bold text-cyan-400">{metrics.aIndex}</span>
            <span className="text-xs text-gray-500">0-50</span>
          </div>
          <div className="w-full bg-slate-600 h-2 rounded"><div className="bg-cyan-500 h-2 rounded" style={{width: `${(metrics.aIndex/50)*100}%`}}></div></div>
        </div>

        <div className="bg-slate-700/50 p-4 rounded">
          <p className="text-gray-400 text-sm mb-2">Solar Wind Speed</p>
          <div className="flex justify-between items-end mb-2">
            <span className="text-2xl font-bold text-orange-400">{Math.round(metrics.solarWind)}</span>
            <span className="text-xs text-gray-500">km/s</span>
          </div>
          <div className="w-full bg-slate-600 h-2 rounded"><div className="bg-orange-500 h-2 rounded" style={{width: `${(metrics.solarWind/500)*100}%`}}></div></div>
        </div>

        <div className="bg-slate-700/50 p-4 rounded">
          <p className="text-gray-400 text-sm mb-2">Particle Density</p>
          <div className="flex justify-between items-end mb-2">
            <span className="text-2xl font-bold text-blue-400">{metrics.particleDensity.toFixed(1)}</span>
            <span className="text-xs text-gray-500">protons/cm³</span>
          </div>
          <div className="w-full bg-slate-600 h-2 rounded"><div className="bg-blue-500 h-2 rounded" style={{width: `${(metrics.particleDensity/6)*100}%`}}></div></div>
        </div>

        <div className="bg-slate-700/50 p-4 rounded">
          <p className="text-gray-400 text-sm mb-2">Interplanetary Magnetic Field</p>
          <div className="flex justify-between items-end mb-2">
            <span className="text-2xl font-bold text-purple-400">{metrics.imf.toFixed(1)}</span>
            <span className="text-xs text-gray-500">nanoTesla</span>
          </div>
          <div className="w-full bg-slate-600 h-2 rounded"><div className="bg-purple-500 h-2 rounded" style={{width: `${(metrics.imf/12)*100}%`}}></div></div>
        </div>
      </div>

      {/* Status Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-700/50 p-4 rounded border border-red-500/30">
          <p className="text-gray-400 text-sm">Geomagnetic Storm Status</p>
          <p className="text-xl font-bold text-red-400">{metrics.stormStatus}</p>
        </div>
        <div className="bg-slate-700/50 p-4 rounded border border-yellow-500/30">
          <p className="text-gray-400 text-sm">Solar Activity</p>
          <p className="text-xl font-bold text-yellow-400">{metrics.sunActivity}</p>
        </div>
      </div>

      {/* Aurora Forecast */}
      <div className="bg-slate-700/50 p-4 rounded">
        <h3 className="font-bold text-cyan-400 mb-1">Aurora Forecast by Latitude</h3>
        <p className="text-xs text-gray-500 mb-4">Approximate: the stronger the geomagnetic activity, the further south the aurora can be seen.</p>
        <div className="space-y-2 text-sm">
          {[
            { zone: 'Far North (65-75°N)', minKp: 2, yes: '✓ Visible' },
            { zone: 'North (55-65°N)', minKp: 5, yes: '✓ Visible' },
            { zone: 'Mid-North (45-55°N)', minKp: 7, yes: 'Possible' },
            { zone: 'Lower Mid (35-45°N)', minKp: 9, yes: 'Rare' }
          ].map((z) => (
            <div key={z.zone} className="flex justify-between">
              <span>{z.zone}</span>
              <span className={kpIndex >= z.minKp ? 'text-green-400' : 'text-gray-500'}>
                {kpIndex >= z.minKp ? z.yes : 'Not visible'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
