'use client'
import { useEffect, useState } from 'react'

export default function HomePage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [stars, setStars] = useState<Array<{ x: number; y: number; size: number }>>([])

  useEffect(() => {
    const newStars = Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5
    }))
    setStars(newStars)
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Starfield background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-blue-900">
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: Math.random() * 0.7 + 0.3
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <h1 className="text-6xl md:text-8xl font-bold gradient-text mb-4">
          COSMIC ERA
        </h1>
        
        <p className="text-gray-400 mb-8 text-lg">
          Earth Monitoring • Satellite Data • Magnetic Field Analysis
        </p>

        <button
          onClick={() => onNavigate('dashboard')}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl mb-12 transition transform hover:scale-105"
        >
          🌍 Where Do You Wanna Visit?
        </button>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl">
          <div className="bg-slate-800/50 border border-cyan-500/30 p-6 rounded-lg hover:border-cyan-500 transition">
            <div className="text-3xl mb-2">📡</div>
            <h3 className="text-cyan-400 font-bold mb-2">Satellite Calendars</h3>
            <p className="text-sm text-gray-400">MODIS, VIIRS & Harmonized views</p>
          </div>
          
          <div className="bg-slate-800/50 border border-cyan-500/30 p-6 rounded-lg hover:border-cyan-500 transition">
            <div className="text-3xl mb-2">🔥</div>
            <h3 className="text-cyan-400 font-bold mb-2">Hotspot Map</h3>
            <p className="text-sm text-gray-400">8 global regions with intensity data</p>
          </div>
          
          <div className="bg-slate-800/50 border border-cyan-500/30 p-6 rounded-lg hover:border-cyan-500 transition">
            <div className="text-3xl mb-2">🧲</div>
            <h3 className="text-cyan-400 font-bold mb-2">Magnetic Field</h3>
            <p className="text-sm text-gray-400">Kp Index & aurora forecast</p>
          </div>
          
          <div className="bg-slate-800/50 border border-cyan-500/30 p-6 rounded-lg hover:border-cyan-500 transition">
            <div className="text-3xl mb-2">🤖</div>
            <h3 className="text-cyan-400 font-bold mb-2">AI Assistant</h3>
            <p className="text-sm text-gray-400">Ask anything about Earth & space</p>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-4 text-center text-gray-500 text-sm">
          <p>🚀 NASA Space Apps Challenge 2026</p>
          <p>Team: Cosmic Era</p>
        </div>
      </div>
    </div>
  )
}
