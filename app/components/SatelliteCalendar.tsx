'use client'
import { useState } from 'react'
import { addMonths, subMonths, format, getDaysInMonth, startOfMonth } from 'date-fns'

export default function SatelliteCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarType, setCalendarType] = useState<'modis' | 'viirs' | 'harmonized'>('harmonized')

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = startOfMonth(currentDate).getDay()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Demo data: a repeatable pattern that changes with the month and the satellite type
  const typeOffset = calendarType === 'modis' ? 11 : calendarType === 'viirs' ? 37 : 0
  const getIntensity = (day: number) => {
    const seed = day * 73 + currentDate.getMonth() * 29 + (currentDate.getFullYear() % 100) * 7 + typeOffset
    return Math.abs(seed) % 100
  }

  const getColor = (intensity: number) => {
    if (intensity < 10) return 'bg-gray-700'
    if (intensity < 20) return 'bg-yellow-600'
    if (intensity < 50) return 'bg-orange-600'
    return 'bg-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded">← Prev</button>
          <span className="px-4 py-2 bg-slate-700 rounded">{format(currentDate, 'MMMM yyyy')}</span>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded">Next →</button>
        </div>

        <select
          value={calendarType}
          onChange={(e) => setCalendarType(e.target.value as any)}
          className="px-4 py-2 bg-slate-700 text-white rounded border border-cyan-500/30"
        >
          <option value="modis">MODIS Only (NASA Terra/Aqua)</option>
          <option value="viirs">VIIRS Only (NOAA)</option>
          <option value="harmonized">Harmonized (Combined)</option>
        </select>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center font-bold text-cyan-400 py-2">{day}</div>
        ))}

        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="p-3 text-center"></div>
        ))}

        {days.map((day) => {
          const intensity = getIntensity(day)
          return (
            <div
              key={day}
              className={`p-3 rounded text-center ${getColor(intensity)} hover:ring-2 ring-cyan-400 cursor-pointer transition`}
              title={`Day ${day}: ${intensity}% intensity`}
            >
              <div className="font-bold">{day}</div>
              <div className="text-xs text-gray-200">{intensity}%</div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-4 gap-2">
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-700"></div><span className="text-sm">0-10%</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-600"></div><span className="text-sm">10-20%</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-orange-600"></div><span className="text-sm">20-50%</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-600"></div><span className="text-sm">50%+</span></div>
      </div>

      <div className="bg-slate-700/50 p-4 rounded text-sm text-gray-300">
        <p><strong>📡 Data Source:</strong> {calendarType === 'modis' ? 'NASA MODIS (Terra/Aqua)' : calendarType === 'viirs' ? 'NOAA VIIRS' : 'Combined MODIS + VIIRS'}</p>
        <p>Color intensity represents hotspot detection activity. Darker = less activity, Red = high activity.</p>
      </div>
    </div>
  )
}
