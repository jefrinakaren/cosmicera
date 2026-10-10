'use client'
import { useEffect, useState } from 'react'
import type { DashboardTab } from './Dashboard'

export default function HomePage({ onNavigate }: { onNavigate: (page: string, tab?: DashboardTab) => void }) {
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

        {/* Feature Cards: each one opens its own dashboard tab */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl">
          {([
            { tab: 'calendar', icon: '📡', title: 'Satellite Calendars', text: 'MODIS, VIIRS & Harmonized views' },
            { tab: 'map', icon: '🔥', title: 'Hotspot Map', text: '8 global regions with intensity data' },
            { tab: 'magnetic', icon: '🧲', title: 'Magnetic Field', text: 'Kp Index & aurora forecast' },
            { tab: 'ai', icon: '🤖', title: 'AI Assistant', text: 'Ask anything about Earth & space' }
          ] as Array<{ tab: DashboardTab; icon: string; title: string; text: string }>).map((card) => (
            <button
              key={card.tab}
              type="button"
              onClick={() => onNavigate('dashboard', card.tab)}
              className="bg-slate-800/50 border border-cyan-500/30 p-6 rounded-lg hover:border-cyan-500 hover:bg-slate-800 transition cursor-pointer text-center focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <div className="text-3xl mb-2">{card.icon}</div>
              <h3 className="text-cyan-400 font-bold mb-2">{card.title}</h3>
              <p className="text-sm text-gray-400">{card.text}</p>
            </button>
          ))}
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
