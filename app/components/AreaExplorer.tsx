'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { Box, FIRE_LAYER, MODIS_FIRE_LAYER, boxPhotoUrl, fireActivityBox, latestDate, runLimited, shiftDate } from '../lib/gibs'
import { HISTORIC, Hazard, inBox, loadHazards } from '../lib/hazards'
import { BarChart } from './charts'
import { hazardColor } from './DisasterMap'
import { EVENT_STYLE } from '../lib/colors'

const GIBS = 'https://gibs.earthdata.nasa.gov'
type Mode = 'point' | 'box'

const clampLat = (v: number) => Math.max(-85, Math.min(85, v))
const round = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d

function boxAround(lat: number, lng: number, size: number): Box {
  const h = size / 2
  return [clampLat(lat - h), lng - h, clampLat(lat + h), lng + h]
}

const EXAMPLES: { name: string; lat: number; lng: number; size: number }[] = [
  { name: 'Abu Dhabi, UAE', lat: 24.45, lng: 54.38, size: 4 },
  { name: 'Amazon (Rondônia)', lat: -10.5, lng: -63, size: 6 },
  { name: 'Northern Australia', lat: -15, lng: 132, size: 8 },
  { name: 'Punjab, India', lat: 30.5, lng: 75.5, size: 4 },
  { name: 'California', lat: 37, lng: -120, size: 8 },
  { name: 'Central Africa (CAR)', lat: 7, lng: 21, size: 8 },
]

export default function AreaExplorer() {
  const mapDiv = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const LRef = useRef<any>(null)
  const rectRef = useRef<any>(null)
  const drawing = useRef<{ start: any } | null>(null)
  const modeRef = useRef<Mode>('point')

  const [mode, setMode] = useState<Mode>('point')
  const [size, setSize] = useState(4)
  const [latIn, setLatIn] = useState('24.45')
  const [lngIn, setLngIn] = useState('54.38')
  const [box, setBox] = useState<Box | null>(null)
  const [date, setDate] = useState(() => latestDate())
  const [today, setToday] = useState<number | null | undefined>(undefined)
  const [history, setHistory] = useState<{ year: number; value: number | null }[]>([])
  const [histProgress, setHistProgress] = useState(0)
  const [hazards, setHazards] = useState<Hazard[]>([])
  const [inputError, setInputError] = useState('')

  modeRef.current = mode
  const sizeRef = useRef(size)
  sizeRef.current = size
  const newest = latestDate()
  const thisYear = Number(date.slice(0, 4))

  // Map
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const L = await import('leaflet')
      if (cancelled || !mapDiv.current || mapRef.current) return
      LRef.current = L
      const map = L.map(mapDiv.current, { center: [20, 20], zoom: 2, minZoom: 2, maxZoom: 10, worldCopyJump: true })
      mapRef.current = map
      L.tileLayer(`${GIBS}/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg`, {
        maxNativeZoom: 8,
        attribution: 'NASA GIBS',
      }).addTo(map)
      L.tileLayer(`${GIBS}/wmts/epsg3857/best/Reference_Features_15m/default/GoogleMapsCompatible_Level13/{z}/{y}/{x}.png`, {
        maxNativeZoom: 9,
        opacity: 0.6,
      }).addTo(map)

      map.on('click', (e: any) => {
        if (modeRef.current !== 'point') return
        setLatIn(String(round(e.latlng.lat)))
        setLngIn(String(round(e.latlng.lng)))
        setBox(boxAround(e.latlng.lat, e.latlng.lng, sizeRef.current))
      })
      map.on('mousedown', (e: any) => {
        if (modeRef.current !== 'box') return
        drawing.current = { start: e.latlng }
      })
      map.on('mousemove', (e: any) => {
        if (modeRef.current !== 'box' || !drawing.current) return
        const b = L.latLngBounds(drawing.current.start, e.latlng)
        if (rectRef.current) rectRef.current.setBounds(b)
        else rectRef.current = L.rectangle(b, { color: '#34d399', weight: 2, fillOpacity: 0.12 }).addTo(map)
      })
      map.on('mouseup', (e: any) => {
        if (modeRef.current !== 'box' || !drawing.current) return
        const s = drawing.current.start
        drawing.current = null
        const south = clampLat(Math.min(s.lat, e.latlng.lat))
        const north = clampLat(Math.max(s.lat, e.latlng.lat))
        const west = Math.min(s.lng, e.latlng.lng)
        const east = Math.max(s.lng, e.latlng.lng)
        if (north - south < 0.3 || east - west < 0.3) return
        setLatIn(String(round((south + north) / 2)))
        setLngIn(String(round((west + east) / 2)))
        setBox([south, west, north, Math.min(east, west + 60)])
      })
    })()
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // Box drawing mode: stop the map from panning while you drag
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (mode === 'box') {
      map.dragging.disable()
      map.getContainer().style.cursor = 'crosshair'
    } else {
      map.dragging.enable()
      map.getContainer().style.cursor = ''
    }
  }, [mode])

  // Show the selected box on the map
  useEffect(() => {
    const L = LRef.current
    const map = mapRef.current
    if (!L || !map || !box) return
    const b = L.latLngBounds([box[0], box[1]], [box[2], box[3]])
    if (rectRef.current) rectRef.current.setBounds(b)
    else rectRef.current = L.rectangle(b, { color: '#34d399', weight: 2, fillOpacity: 0.12 }).addTo(map)
    map.fitBounds(b.pad(1.2), { maxZoom: 7 })
  }, [box])

  const goToTyped = useCallback(() => {
    const lat = Number(latIn)
    const lng = Number(lngIn)
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -85 || lat > 85 || lng < -180 || lng > 180) {
      setInputError('Latitude must be between -85 and 85, longitude between -180 and 180.')
      return
    }
    setInputError('')
    setBox(boxAround(lat, lng, size))
  }, [latIn, lngIn, size])

  // Today's fire activity for the box
  useEffect(() => {
    if (!box) return
    let cancelled = false
    setToday(undefined)
    fireActivityBox(box, date, date >= '2024-02-01' ? FIRE_LAYER : MODIS_FIRE_LAYER).then((v) => !cancelled && setToday(v))
    return () => {
      cancelled = true
    }
  }, [box, date])

  // History: the same days of the year, every year since 2001 (MODIS Terra, the same instrument every year)
  useEffect(() => {
    if (!box) return
    let cancelled = false
    const years = Array.from({ length: thisYear - 2001 + 1 }, (_, i) => 2001 + i)
    setHistory(years.map((year) => ({ year, value: null })))
    setHistProgress(0)
    let done = 0
    const md = date.slice(5)
    runLimited(years, 6, async (year) => {
      const center = `${year}-${md}`
      // 3 days (centre ±3) smooth out clouds and missed passes
      const days = [-3, 0, 3].map((d) => shiftDate(center, d)).filter((d) => d <= newest)
      const vals = (await Promise.all(days.map((d) => fireActivityBox(box, d, MODIS_FIRE_LAYER)))).filter((v): v is number => v !== null)
      const value = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
      if (!cancelled) {
        done++
        setHistProgress(done / years.length)
        setHistory((h) => h.map((x) => (x.year === year ? { year, value } : x)))
      }
    })
    return () => {
      cancelled = true
    }
  }, [box, date, thisYear, newest])

  // Hazards inside the box (last 12 months + famous past events)
  useEffect(() => {
    if (!box) return
    let cancelled = false
    loadHazards(365).then((r) => {
      if (cancelled) return
      setHazards([...r.items, ...HISTORIC].filter((h) => inBox(h, box)))
    })
    return () => {
      cancelled = true
    }
  }, [box])

  const stats = useMemo(() => {
    const past = history.filter((h) => h.year < thisYear && h.value !== null) as { year: number; value: number }[]
    if (!past.length) return null
    const avg = past.reduce((a, b) => a + b.value, 0) / past.length
    const max = past.reduce((a, b) => (b.value > a.value ? b : a))
    const now = history.find((h) => h.year === thisYear)?.value ?? null
    return { avg, max, now }
  }, [history, thisYear])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-cyan-400">Explore any area on Earth</h2>
        <p className="text-sm text-gray-400">
          Click a point, draw a box, or type a latitude and longitude. You will get a satellite photo, today&apos;s fire activity, 25 years of history for the same
          days of the year, and any disasters nearby.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 text-sm">
            <button onClick={() => setMode('point')} className={`px-3 py-1 rounded ${mode === 'point' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-gray-300'}`}>
              📍 Click a point
            </button>
            <button onClick={() => setMode('box')} className={`px-3 py-1 rounded ${mode === 'box' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-gray-300'}`}>
              ▭ Draw a box (drag on the map)
            </button>
            {mode === 'point' && (
              <label className="flex items-center gap-2 text-gray-300">
                Area size
                <select value={size} onChange={(e) => setSize(Number(e.target.value))} className="bg-slate-700 rounded px-2 py-1">
                  {[1, 2, 4, 6, 10, 20].map((s) => (
                    <option key={s} value={s}>
                      {s}° × {s}° (≈{Math.round(s * 111)} km)
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <div className="map-wrap">
            <div ref={mapDiv} className="h-[420px] w-full rounded-lg border border-cyan-500/20" />
          </div>
          {mode === 'box' && <p className="text-xs text-gray-400">Box mode: the map will not pan. Press and drag to draw. Switch back to point mode to move the map.</p>}
        </div>

        <div className="space-y-3 bg-slate-900/50 rounded-lg p-4 border border-cyan-500/20">
          <p className="font-semibold text-gray-200">⌨️ Enter coordinates</p>
          <label className="block text-sm text-gray-300">
            Latitude (−85 south to 85 north)
            <input value={latIn} onChange={(e) => setLatIn(e.target.value)} inputMode="decimal" className="w-full mt-1 bg-slate-700 rounded px-2 py-1" />
          </label>
          <label className="block text-sm text-gray-300">
            Longitude (−180 west to 180 east)
            <input value={lngIn} onChange={(e) => setLngIn(e.target.value)} inputMode="decimal" className="w-full mt-1 bg-slate-700 rounded px-2 py-1" />
          </label>
          <button onClick={goToTyped} className="w-full bg-cyan-600 hover:bg-cyan-700 rounded py-2 font-semibold">
            Explore this place
          </button>
          {inputError && <p className="text-xs text-red-300">{inputError}</p>}
          <div>
            <p className="text-xs text-gray-400 mb-1">Or try:</p>
            <div className="flex flex-wrap gap-1">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.name}
                  onClick={() => {
                    setMode('point')
                    setLatIn(String(ex.lat))
                    setLngIn(String(ex.lng))
                    setSize(ex.size)
                    setBox(boxAround(ex.lat, ex.lng, ex.size))
                  }}
                  className="text-xs bg-slate-700 hover:bg-slate-600 rounded px-2 py-1"
                >
                  {ex.name}
                </button>
              ))}
            </div>
          </div>
          <label className="block text-sm text-gray-300">
            Date
            <input
              type="date"
              value={date}
              min="2001-01-04"
              max={newest}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="w-full mt-1 bg-slate-700 rounded px-2 py-1 [color-scheme:dark]"
            />
          </label>
        </div>
      </div>

      {!box && <p className="text-center text-gray-400 py-6">👆 Pick an area to start.</p>}

      {box && (
        <div className="space-y-5">
          <p className="text-sm text-gray-300">
            Area: {round(box[0], 1)}° to {round(box[2], 1)}° latitude, {round(box[1], 1)}° to {round(box[3], 1)}° longitude · about{' '}
            {Math.round((box[2] - box[0]) * 111).toLocaleString()} × {Math.round((box[3] - box[1]) * 111 * Math.cos((((box[0] + box[2]) / 2) * Math.PI) / 180)).toLocaleString()}{' '}
            km
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <figure className="bg-slate-900 rounded overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={boxPhotoUrl(box, date)} alt="Satellite photo of the selected area with fires marked in red" className="w-full" />
              <figcaption className="text-xs p-2 text-gray-400">🛰️ NASA satellite photo on {date}. Red dots = fires.</figcaption>
            </figure>
            <div className="space-y-3">
              <div className="bg-slate-900/60 rounded-lg p-4">
                <p className="text-sm text-gray-400">Fire activity on {date}</p>
                <p className="text-3xl font-bold text-orange-400">
                  {today === undefined ? '…' : today === null ? 'n/a' : today.toFixed(2) + '%'}
                </p>
                <p className="text-xs text-gray-500">
                  Share of the area marked with fire detections ({date >= '2024-02-01' ? 'VIIRS NOAA-21' : 'MODIS Terra'}). 0% = no fires seen (or clouds hid them).
                </p>
              </div>
              {stats && (
                <div className="bg-slate-900/60 rounded-lg p-4 text-sm text-gray-200 space-y-1">
                  <p>
                    📊 Average for these days of the year since 2001 (MODIS): <b>{stats.avg.toFixed(2)}%</b>
                  </p>
                  <p>
                    🔥 Busiest year: <b>{stats.max.year}</b> ({stats.max.value.toFixed(2)}%)
                  </p>
                  {stats.now !== null && (
                    <p>
                      📅 {thisYear}: <b>{stats.now.toFixed(2)}%</b> –{' '}
                      {stats.avg === 0
                        ? stats.now > 0
                          ? 'more than usual (normally no fires here at this time)'
                          : 'the same as usual (no fires)'
                        : stats.now >= stats.avg
                          ? `${Math.round(((stats.now - stats.avg) / stats.avg) * 100)}% MORE than average`
                          : `${Math.round(((stats.avg - stats.now) / stats.avg) * 100)}% LESS than average`}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-cyan-400">
              Historical comparison: {new Date(date + 'T00:00:00Z').toLocaleDateString(undefined, { day: 'numeric', month: 'long', timeZone: 'UTC' })} in every year
              since 2001
            </h3>
            <p className="text-xs text-gray-400 mb-2">
              MODIS Terra fire activity in this area, averaged over 3 days around the date (to reduce the effect of clouds).{' '}
              {histProgress < 1 ? `Loading ${Math.round(histProgress * 100)}%…` : ''}
            </p>
            <BarChart
              data={history.map((h) => ({ label: String(h.year), value: h.value, color: h.year === thisYear ? '#f97316' : '#34d399' }))}
              format={(v) => v.toFixed(v < 1 ? 2 : 1) + '%'}
              height={220}
            />
          </div>

          <div>
            <h3 className="font-bold text-cyan-400 mb-1">Disasters inside this area</h3>
            <p className="text-xs text-gray-400 mb-2">Last 12 months (earthquakes 6+, GDACS alerts, NASA EONET events) and famous past events.</p>
            {hazards.length === 0 ? (
              <p className="text-sm text-gray-400">None found. Try a bigger area.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {hazards
                  .sort((a, b) => (b.date > a.date ? 1 : -1))
                  .slice(0, 30)
                  .map((h) => (
                    <li key={h.id} className="flex items-center gap-2 bg-slate-900/40 rounded px-3 py-1.5">
                      <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ background: hazardColor(h) }} />
                      <span>{EVENT_STYLE[h.kind].icon}</span>
                      <span className="flex-1">{h.title}</span>
                      <span className="text-xs text-gray-400">{h.historic ? h.date.slice(0, 4).replace(/^0+/, '') : new Date(h.date).toLocaleDateString()}</span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
