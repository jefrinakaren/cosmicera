'use client'
import { useState } from 'react'
import SatelliteCalendar from './SatelliteCalendar'
import SatelliteHistory from './SatelliteHistory'
import HotspotMap from './HotspotMap'
import FireAnalysis from './FireAnalysis'
import AreaExplorer from './AreaExplorer'
import DisasterMap from './DisasterMap'
import MagneticField from './MagneticField'
import AIAssistant from './AIAssistant'

export type DashboardTab = 'calendar' | 'map' | 'analysis' | 'explore' | 'disasters' | 'magnetic' | 'ai'

export const TABS: { id: DashboardTab; label: string }[] = [
  { id: 'calendar', label: '🛰️ Satellites' },
  { id: 'map', label: '🔥 Hotspot Map' },
  { id: 'analysis', label: '📊 Fire Analysis' },
  { id: 'explore', label: '📍 Explore an Area' },
  { id: 'disasters', label: '🌋 Disaster Map' },
  { id: 'magnetic', label: '🧲 Magnetic Field & Core' },
  { id: 'ai', label: '🤖 AI Assistant' },
]

export default function Dashboard({ initialTab = 'calendar' }: { initialTab?: DashboardTab }) {
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-cyan-500/20 pb-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded transition ${activeTab === tab.id ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-slate-800/50 rounded-lg p-4 md:p-6 border border-cyan-500/20">
          {activeTab === 'calendar' && (
            <div className="space-y-10">
              <SatelliteHistory />
              <SatelliteCalendar />
            </div>
          )}
          {activeTab === 'map' && <HotspotMap />}
          {activeTab === 'analysis' && <FireAnalysis />}
          {activeTab === 'explore' && <AreaExplorer />}
          {activeTab === 'disasters' && <DisasterMap />}
          {activeTab === 'magnetic' && <MagneticField />}
          {activeTab === 'ai' && <AIAssistant />}
        </div>

        <p className="mt-4 text-xs text-gray-500 text-center">
          ℹ️ Live data from NASA (GIBS, EONET), NOAA, USGS, GDACS and GWIS. The practice calendar at the bottom of the Satellites tab is simulated for learning.
        </p>
      </div>
    </div>
  )
}
