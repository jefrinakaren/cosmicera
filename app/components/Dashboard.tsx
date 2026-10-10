'use client'
import { useState } from 'react'
import SatelliteCalendar from './SatelliteCalendar'
import HotspotMap from './HotspotMap'
import MagneticField from './MagneticField'
import AIAssistant from './AIAssistant'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'map' | 'magnetic' | 'ai'>('calendar')

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-cyan-500/20 pb-4">
          {[
            { id: 'calendar', label: '📡 Calendars' },
            { id: 'map', label: '🔥 Hotspot Map' },
            { id: 'magnetic', label: '🧲 Magnetic Field' },
            { id: 'ai', label: '🤖 AI Assistant' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded transition ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-slate-800/50 rounded-lg p-6 border border-cyan-500/20">
          {activeTab === 'calendar' && <SatelliteCalendar />}
          {activeTab === 'map' && <HotspotMap />}
          {activeTab === 'magnetic' && <MagneticField />}
          {activeTab === 'ai' && <AIAssistant />}
        </div>

        <p className="mt-4 text-xs text-gray-500 text-center">
          ℹ️ Demo data: the numbers on this dashboard are simulated for learning. They are modelled on the kinds of measurements NASA MODIS / NOAA VIIRS satellites and NOAA space-weather stations provide.
        </p>
      </div>
    </div>
  )
}
