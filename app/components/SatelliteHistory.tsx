'use client'
import { useMemo, useState } from 'react'
import { COMPARISON, MILESTONES } from '../lib/satellites'
import { BLUE_MARBLE_LAYER, MODIS_FIRE_LAYER, VIIRS_SNPP_FIRE_LAYER, latestDate, wmsUrl } from '../lib/gibs'

const WHO_COLOR = { MODIS: '#f59e0b', VIIRS: '#34d399', Both: '#a78bfa' }

const ZOOMS = [
  { name: 'Whole world', box: [-60, -180, 80, 180] as [number, number, number, number] },
  { name: 'Africa', box: [-35, -20, 20, 55] as [number, number, number, number] },
  { name: 'South America', box: [-35, -82, 10, -32] as [number, number, number, number] },
  { name: 'South-East Asia', box: [-12, 90, 25, 150] as [number, number, number, number] },
  { name: 'Australia', box: [-45, 110, -8, 158] as [number, number, number, number] },
  { name: 'North America', box: [20, -140, 70, -55] as [number, number, number, number] },
  { name: 'Siberia', box: [45, 80, 72, 150] as [number, number, number, number] },
]

export default function SatelliteHistory() {
  const newest = latestDate()
  const thisYear = Number(newest.slice(0, 4))
  const [pastYear, setPastYear] = useState(2005)
  const [monthDay, setMonthDay] = useState('08-15')
  const [zoom, setZoom] = useState(0)

  const box = ZOOMS[zoom].box
  // Same day of the year: "past" vs the most recent year that already has this date
  const pastDate = `${pastYear}-${monthDay}`
  const nowDate = useMemo(() => {
    const d = `${thisYear}-${monthDay}`
    return d <= newest ? d : `${thisYear - 1}-${monthDay}`
  }, [monthDay, thisYear, newest])

  const w = 720
  const h = Math.round((w * (box[2] - box[0])) / (box[3] - box[1]))
  const img = (date: string, fire: string) => wmsUrl(`${BLUE_MARBLE_LAYER},${fire}`, box, w, h, 'image/jpeg', date)

  // Resolution demo: a small 4 x 3 degree area in the Brazilian Cerrado, same day, both instruments
  const demoBox: [number, number, number, number] = [-12, -48, -9, -44]
  const demoDate = '2024-09-01'

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-cyan-400">MODIS and VIIRS: 25 years of watching Earth burn</h2>
        <p className="text-sm text-gray-400">
          Two instruments on NASA and NOAA satellites have photographed every fire on Earth, every day, since the year 2000. This is their story.
        </p>
      </div>

      {/* Timeline */}
      <div className="relative pl-6">
        <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-slate-600" />
        <div className="space-y-4">
          {MILESTONES.map((m) => (
            <div key={m.title} className="relative">
              <span className="absolute -left-[1.15rem] top-1.5 w-3 h-3 rounded-full border-2 border-slate-900" style={{ background: WHO_COLOR[m.who] }} />
              <p className="text-xs text-gray-400">
                <b className="text-gray-200">{m.date}</b> ·{' '}
                <span style={{ color: WHO_COLOR[m.who] }} className="font-semibold">
                  {m.who}
                </span>
              </p>
              <p className="font-semibold text-gray-100">{m.title}</p>
              <p className="text-sm text-gray-300">{m.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison table */}
      <div>
        <h3 className="text-lg font-bold text-cyan-400 mb-2">MODIS vs VIIRS side by side</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th></th>
                <th style={{ color: WHO_COLOR.MODIS }}>MODIS</th>
                <th style={{ color: WHO_COLOR.VIIRS }}>VIIRS</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((r) => (
                <tr key={r.feature}>
                  <td className="font-semibold text-gray-200">{r.feature}</td>
                  <td className="text-gray-300">{r.modis}</td>
                  <td className="text-gray-300">{r.viirs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution demo */}
      <div>
        <h3 className="text-lg font-bold text-cyan-400 mb-1">Why VIIRS sees more fires</h3>
        <p className="text-sm text-gray-400 mb-3">
          The same small area of Brazil on {demoDate}, seen by both instruments. Each dot is a fire. VIIRS pixels are smaller, so it catches small fires that MODIS
          misses.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { name: 'MODIS (Terra), 1 km pixels', layer: MODIS_FIRE_LAYER, color: WHO_COLOR.MODIS },
            { name: 'VIIRS (Suomi NPP), 375 m pixels', layer: VIIRS_SNPP_FIRE_LAYER, color: WHO_COLOR.VIIRS },
          ].map((s) => (
            <figure key={s.name} className="bg-slate-900 rounded overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={wmsUrl(`MODIS_Terra_CorrectedReflectance_TrueColor,${s.layer}`, demoBox, 480, 360, 'image/jpeg', demoDate)}
                alt={`${s.name} fire detections`}
                className="w-full"
                loading="lazy"
              />
              <figcaption className="text-xs p-2" style={{ color: s.color }}>
                {s.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      {/* Time machine */}
      <div>
        <h3 className="text-lg font-bold text-cyan-400 mb-1">🕰️ Time machine: then vs now</h3>
        <p className="text-sm text-gray-400 mb-3">
          Pick a year from the early 2000s and a day. The left map shows MODIS fires on that day; the right map shows MODIS fires on the same day in the latest year.
          Using the same instrument for both makes the comparison fair.
        </p>
        <div className="flex flex-wrap gap-3 items-center mb-3 text-sm">
          <label className="flex items-center gap-2">
            Past year
            <select value={pastYear} onChange={(e) => setPastYear(Number(e.target.value))} className="bg-slate-700 rounded px-2 py-1">
              {Array.from({ length: thisYear - 2001 }, (_, i) => 2001 + i).map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            Day
            <select
              value={Number(monthDay.slice(3))}
              onChange={(e) => setMonthDay(`${monthDay.slice(0, 2)}-${String(e.target.value).padStart(2, '0')}`)}
              className="bg-slate-700 rounded px-2 py-1"
            >
              {Array.from({ length: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][Number(monthDay.slice(0, 2)) - 1] }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={monthDay.slice(0, 2)}
              onChange={(e) => {
                const day = Math.min(Number(monthDay.slice(3)), [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][Number(e.target.value) - 1])
                setMonthDay(`${e.target.value}-${String(day).padStart(2, '0')}`)
              }}
              className="bg-slate-700 rounded px-2 py-1"
            >
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                <option key={m} value={String(i + 1).padStart(2, '0')}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            Zoom to
            <select value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="bg-slate-700 rounded px-2 py-1">
              {ZOOMS.map((z, i) => (
                <option key={z.name} value={i}>
                  {z.name}
                </option>
              ))}
            </select>
          </label>
          <span className="text-xs text-gray-400">(the year picker skips {thisYear}; the right map always shows the newest year)</span>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { label: pastDate, date: pastDate },
            { label: nowDate, date: nowDate },
          ].map((p, i) => (
            <figure key={i} className="bg-slate-900 rounded overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img(p.date, MODIS_FIRE_LAYER)} alt={`MODIS fires on ${p.label}`} className="w-full" />
              <figcaption className="text-xs p-2 text-gray-300">
                {i === 0 ? '⏪ Then' : '⏩ Now'}: MODIS Terra fires on <b>{p.label}</b>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Tip: try 15 August (Africa and the Amazon), 1 January (Australia, West Africa) or 15 April (India and South-East Asia). Want the exact numbers? The Fire
          Analysis tab counts the fires on 620 sample days since 2001.
        </p>
        <p className="text-xs text-gray-500">Imagery: NASA GIBS (Blue Marble background + MODIS Terra fire detections).</p>
      </div>
    </div>
  )
}
