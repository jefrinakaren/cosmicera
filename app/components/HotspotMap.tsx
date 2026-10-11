'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { REGIONS, Region } from '../lib/regions'
import { FIRE_LAYER, TRUE_COLOR_LAYER, fireActivity, latestDate, regionPhotoUrl, shiftDate } from '../lib/gibs'
import { CommonsPhoto, fetchCommonsPhotos } from '../lib/commons'

const GIBS = 'https://gibs.earthdata.nasa.gov'
const MIN_DATE = '2024-02-01'

function markerStyle(cover: number | null, selected: boolean) {
  const base = cover === null ? '#9ca3af' : cover < 2 ? '#facc15' : cover < 6 ? '#fb923c' : '#ef4444'
  return {
    color: selected ? '#ffffff' : base,
    weight: selected ? 3 : 2,
    fillColor: base,
    fillOpacity: 0.55,
    radius: cover === null ? 9 : Math.min(26, 9 + Math.sqrt(cover) * 3.2),
  }
}

export default function HotspotMap() {
  const mapDiv = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const leafletRef = useRef<any>(null)
  const dailyLayer = useRef<any>(null)
  const fireLayer = useRef<any>(null)
  const markers = useRef<Record<string, any>>({})

  const [date, setDate] = useState<string>(() => latestDate())
  const [showFires, setShowFires] = useState(true)
  const [continent, setContinent] = useState('all')
  const [selected, setSelected] = useState<Region | null>(null)
  const [cover, setCover] = useState<Record<string, number | null>>({})
  const [loadingCover, setLoadingCover] = useState(true)
  const [photos, setPhotos] = useState<Record<string, CommonsPhoto>>({})
  const [photoError, setPhotoError] = useState(false)

  const newest = latestDate()
  const continents = useMemo(() => ['all', ...Array.from(new Set(REGIONS.map((r) => r.continent)))], [])
  const visible = useMemo(() => REGIONS.filter((r) => continent === 'all' || r.continent === continent), [continent])
  const ranked = useMemo(
    () => [...visible].sort((a, b) => (cover[b.country] ?? -1) - (cover[a.country] ?? -1)),
    [visible, cover]
  )

  const selectRegion = useCallback((region: Region | null) => {
    setSelected(region)
    if (region && mapRef.current) mapRef.current.flyTo([region.lat, region.lng], region.zoom, { duration: 1.2 })
  }, [])

  // 1. Build the map once
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const L = await import('leaflet')
      if (cancelled || !mapDiv.current || mapRef.current) return
      leafletRef.current = L

      const map = L.map(mapDiv.current, {
        center: [15, 10],
        zoom: 2,
        minZoom: 2,
        maxZoom: 9,
        worldCopyJump: true,
        zoomSnap: 0.5,
      })
      mapRef.current = map

      // Base: NASA Blue Marble (always available), then today's real satellite photo on top
      L.tileLayer(`${GIBS}/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg`, {
        maxNativeZoom: 8,
        attribution: 'Imagery: NASA GIBS / Blue Marble',
      }).addTo(map)

      dailyLayer.current = L.tileLayer(
        `${GIBS}/wmts/epsg3857/best/${TRUE_COLOR_LAYER}/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
        { maxNativeZoom: 9, attribution: 'NASA GIBS / VIIRS satellite photo' }
      ).addTo(map)

      // Real fire detections, drawn by NASA's server
      fireLayer.current = (L.tileLayer as any)
        .wms(`${GIBS}/wms/epsg3857/best/wms.cgi`, {
          layers: FIRE_LAYER,
          format: 'image/png',
          transparent: true,
          version: '1.3.0',
          TIME: date,
          attribution: 'Fires: NASA VIIRS / FIRMS',
        })
        .addTo(map)

      REGIONS.forEach((region) => {
        const m = L.circleMarker([region.lat, region.lng], markerStyle(null, false)).addTo(map)
        m.bindTooltip(region.country, { direction: 'top' })
        m.on('click', () => selectRegion(region))
        markers.current[region.country] = m
      })
    })()
    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 2. New date -> new satellite photo, new fire detections, new fire activity numbers
  useEffect(() => {
    if (dailyLayer.current) {
      dailyLayer.current.setUrl(
        `${GIBS}/wmts/epsg3857/best/${TRUE_COLOR_LAYER}/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`
      )
    }
    if (fireLayer.current) fireLayer.current.setParams({ TIME: date })

    let stale = false
    setLoadingCover(true)
    ;(async () => {
      const result: Record<string, number | null> = {}
      for (let i = 0; i < REGIONS.length; i += 4) {
        const batch = REGIONS.slice(i, i + 4)
        const values = await Promise.all(batch.map((r) => fireActivity(r.lat, r.lng, date)))
        batch.forEach((r, k) => (result[r.country] = values[k]))
        if (stale) return
      }
      if (!stale) {
        setCover(result)
        setLoadingCover(false)
      }
    })()
    return () => {
      stale = true
    }
  }, [date])

  // 3. Fires on/off
  useEffect(() => {
    const map = mapRef.current
    const layer = fireLayer.current
    if (!map || !layer) return
    if (showFires) layer.addTo(map)
    else map.removeLayer(layer)
  }, [showFires])

  // 4. Re-colour and filter the markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    REGIONS.forEach((region) => {
      const m = markers.current[region.country]
      if (!m) return
      m.setStyle(markerStyle(cover[region.country] ?? null, selected?.country === region.country))
      m.setRadius(markerStyle(cover[region.country] ?? null, false).radius)
      const show = continent === 'all' || region.continent === continent
      if (show && !map.hasLayer(m)) m.addTo(map)
      if (!show && map.hasLayer(m)) map.removeLayer(m)
    })
  }, [cover, selected, continent])

  // 5. Real photographs (one request for all eight)
  useEffect(() => {
    fetchCommonsPhotos(REGIONS.map((r) => r.photoTitle))
      .then(setPhotos)
      .catch(() => setPhotoError(true))
  }, [])

  const photo = selected ? photos[selected.photoTitle.replace(/_/g, ' ')] : undefined
  const maxCover = Math.max(1, ...Object.values(cover).map((v) => v ?? 0))

  return (
    <div className="space-y-6">
      {/* Intro + live badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">Where is the Earth burning?</h2>
          <p className="text-sm text-gray-400">
            Red dots on the map are fires that NASA satellites detected on the chosen day. Click a country to zoom in.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-300 bg-slate-700/60 rounded-full px-3 py-1 self-start">
          <span className="live-dot" />
          Live NASA data · {date}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setDate(shiftDate(date, -1))} disabled={date <= MIN_DATE} className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-sm disabled:opacity-40">
          ← Day before
        </button>
        <input
          type="date"
          value={date}
          min={MIN_DATE}
          max={newest}
          onChange={(e) => e.target.value && setDate(e.target.value > newest ? newest : e.target.value)}
          className="px-3 py-1 rounded bg-slate-700 text-white text-sm border border-cyan-500/30"
          aria-label="Choose a date"
        />
        <button onClick={() => setDate(shiftDate(date, 1))} disabled={date >= newest} className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-sm disabled:opacity-40">
          Day after →
        </button>
        <button onClick={() => setDate(newest)} disabled={date === newest} className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-700 text-white text-sm disabled:opacity-40">
          Latest
        </button>
        <label className="flex items-center gap-2 text-sm text-gray-300 ml-auto cursor-pointer">
          <input type="checkbox" checked={showFires} onChange={(e) => setShowFires(e.target.checked)} />
          Show NASA fire detections
        </label>
      </div>

      {/* The map */}
      <div className="map-wrap rounded-lg overflow-hidden border border-cyan-500/30">
        <div ref={mapDiv} style={{ height: 460 }} role="application" aria-label="Interactive map of fire detections" />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-400">
        <span><span className="inline-block w-3 h-3 rounded-full align-middle mr-1" style={{ background: '#facc15' }} />Few fires</span>
        <span><span className="inline-block w-3 h-3 rounded-full align-middle mr-1" style={{ background: '#fb923c' }} />Many fires</span>
        <span><span className="inline-block w-3 h-3 rounded-full align-middle mr-1" style={{ background: '#ef4444' }} />Very many fires</span>
        <span>Circle size = how much of the region has fires today. Small red squares = individual fires (zoom in to see them).</span>
      </div>

      {/* Continent filter */}
      <div className="flex gap-2 flex-wrap">
        {continents.map((c) => (
          <button
            key={c}
            onClick={() => setContinent(c)}
            className={`px-3 py-1 rounded text-sm ${continent === c ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-gray-300'}`}
          >
            {c === 'all' ? 'All regions' : c}
          </button>
        ))}
      </div>

      {/* Selected region: real photo + satellite photo */}
      {selected && (
        <div className="bg-slate-700/50 p-4 rounded-lg border border-cyan-500/30 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-bold text-cyan-400">{selected.country}</h3>
              <p className="text-sm text-gray-400">
                📍 {selected.lat}°, {selected.lng}° · 🗓️ Fire season: {selected.season}
              </p>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white text-xl leading-none" aria-label="Close">✕</button>
          </div>

          <p className="text-gray-200">{selected.why}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <figure className="bg-slate-800 rounded-lg overflow-hidden">
              <div className="aspect-[3/2] bg-slate-900 flex items-center justify-center">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo.url} alt={`Fire in ${selected.country}`} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm text-gray-500 px-4 text-center">{photoError ? 'Photo could not be loaded' : 'Loading photo…'}</span>
                )}
              </div>
              <figcaption className="p-3 text-xs text-gray-400">
                <strong className="text-gray-200">📷 Real photo of fire in {selected.country}.</strong>
                {photo && (
                  <>
                    {' '}By {photo.artist} · {photo.license} ·{' '}
                    <a href={photo.page} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">Wikimedia Commons</a>
                  </>
                )}
              </figcaption>
            </figure>

            <figure className="bg-slate-800 rounded-lg overflow-hidden">
              <div className="aspect-[3/2] bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={regionPhotoUrl(selected.lat, selected.lng, date)}
                  alt={`NASA satellite photo of ${selected.country} on ${date} with fires marked`}
                  className="w-full h-full object-cover"
                />
              </div>
              <figcaption className="p-3 text-xs text-gray-400">
                <strong className="text-gray-200">🛰️ From space on {date}.</strong> NASA VIIRS satellite photo with fire detections marked in red. This picture changes every day.
                {cover[selected.country] != null && (
                  <> Fire activity: <strong className="text-orange-400">{cover[selected.country]!.toFixed(1)}%</strong></>
                )}
              </figcaption>
            </figure>
          </div>
        </div>
      )}

      {/* Ranking */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>#</th>
              <th>Country</th>
              <th>Continent</th>
              <th className="min-w-[180px]">Fire activity on {date}</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((region, i) => {
              const value = cover[region.country]
              return (
                <tr key={region.country} onClick={() => selectRegion(region)} className="cursor-pointer hover:bg-cyan-500/10">
                  <td>{i + 1}</td>
                  <td className="font-semibold">{region.country}</td>
                  <td>{region.continent}</td>
                  <td>
                    {value == null ? (
                      <span className="text-gray-500">{loadingCover ? 'Measuring…' : 'No data'}</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-600 rounded overflow-hidden">
                          <div className="h-2 rounded" style={{ width: `${Math.max(3, (value / maxCover) * 100)}%`, background: markerStyle(value, false).fillColor }} />
                        </div>
                        <span className="w-14 text-right tabular-nums">{value.toFixed(1)}%</span>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-700/40 p-4 rounded text-xs text-gray-400 space-y-1">
        <p>
          <strong className="text-gray-200">How is “fire activity” measured?</strong> For each country we take a 30° × 20° satellite view and ask NASA how much of it is marked with fire detections
          (NOAA-21 VIIRS, 375 m). It is a fair way to compare regions on the same day, but it is not an official fire count.
        </p>
        <p>
          Satellite data: NASA GIBS / FIRMS. Photos: Wikimedia Commons (each credited to its author). Fire detections for the most recent day can be incomplete.
        </p>
      </div>
    </div>
  )
}
