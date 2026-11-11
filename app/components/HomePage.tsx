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
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-violet-950">
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
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-16 text-center">
        <h1 className="text-6xl md:text-8xl font-bold gradient-text mb-4">
          COSMIC ERA
        </h1>
        
        <p className="text-gray-400 mb-8 text-lg">
          Earth Monitoring • Satellite Data • Natural Hazards • Magnetic Field
        </p>

        <button
          onClick={() => onNavigate('dashboard')}
          className="bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-700 text-white font-bold py-4 px-8 rounded-lg text-xl mb-12 transition transform hover:scale-105"
        >
          🌍 Where Do You Wanna Visit?
        </button>

        {/* Feature Cards: each one opens its own dashboard tab */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mb-16">
          {([
            { page: 'dashboard', tab: 'calendar', icon: '🛰️', title: 'Satellites', text: '25 years of MODIS & VIIRS history' },
            { page: 'dashboard', tab: 'map', icon: '🔥', title: 'Hotspot Map', text: 'Live NASA fire map + real photos' },
            { page: 'dashboard', tab: 'analysis', icon: '📊', title: 'Fire Analysis', text: 'Graphs, history & country comparisons' },
            { page: 'dashboard', tab: 'explore', icon: '📍', title: 'Explore an Area', text: 'Draw, click or type any place' },
            { page: 'dashboard', tab: 'disasters', icon: '🌋', title: 'Disaster Map', text: 'Floods, quakes, volcanoes & oil spills' },
            { page: 'dashboard', tab: 'magnetic', icon: '🧲', title: 'Magnetic Field & Core', text: "Earth's layers + live space weather" },
            { page: 'warnings', icon: '🚨', title: 'Early Warnings', text: 'Live alerts & warning systems' },
            { page: 'report', icon: '📰', title: 'Daily Report', text: "Today's activity, refreshed daily" },
            { page: 'dashboard', tab: 'ai', icon: '🤖', title: 'AI Assistant', text: 'Ask any science question' }
          ] as Array<{ page: string; tab?: DashboardTab; icon: string; title: string; text: string }>).map((card) => (
            <button
              key={card.title}
              type="button"
              onClick={() => onNavigate(card.page, card.tab)}
              className="bg-slate-800/50 border border-cyan-500/30 p-6 rounded-lg hover:border-cyan-500 hover:bg-slate-800 transition cursor-pointer text-center focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <div className="text-3xl mb-2">{card.icon}</div>
              <h3 className="text-cyan-400 font-bold mb-2">{card.title}</h3>
              <p className="text-sm text-gray-400">{card.text}</p>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="pb-6 text-center text-gray-500 text-sm">
          <p>🚀 NASA Space Apps Challenge 2026</p>
          <p>Team: Cosmic Era</p>
        </div>
      </div>
    </div>
  )
}
