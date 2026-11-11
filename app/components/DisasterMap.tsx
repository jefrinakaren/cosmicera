'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { EVENT_STYLE, EventKind, QUAKE_RAMP, ALERT_COLORS, rampColor } from '../lib/colors'
import { HISTORIC, Hazard, loadHazards } from '../lib/hazards'
import { FIRE_LAYER, latestDate } from '../lib/gibs'
import { EventLegend, RampLegend } from './ColorLegend'

const GIBS = 'https://gibs.earthdata.nasa.gov'
const KINDS: EventKind[] = ['earthquake', 'volcano', 'flood', 'storm', 'oil', 'drought', 'wildfire']

export function hazardColor(h: Hazard) {
  return h.kind === 'earthquake' && h.magnitude !== undefined ? rampColor(QUAKE_RAMP, h.magnitude) : EVENT_STYLE[h.kind].color
}

export function hazardPopup(h: Hazard) {
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
  const date = h.historic ? h.date.slice(0, 4).replace(/^0+/, '') : new Date(h.date).toLocaleString()
  return `<b>${EVENT_STYLE[h.kind].icon} ${esc(h.title)}</b><br/>${date}${h.magnitude !== undefined && h.kind === 'earthquake' ? ` · magnitude ${h.magnitude.toFixed(1)}` : ''}${
    h.alert ? ` · <span style="color:${ALERT_COLORS[h.alert]?.color}">${h.alert} alert</span>` : ''
  }${h.note ? '<br/>' + esc(h.note) : ''}<br/><span style="color:#9ca3af">Source: ${esc(h.source)}${h.historic ? ' (famous past event)' : ''}</span>${
    h.url ? `<br/><a href="${esc(h.url)}" target="_blank" rel="noopener noreferrer">More details ↗</a>` : ''
  }`
}

export default function DisasterMap() {
  const mapDiv = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const LRef = useRef<any>(null)
  const markerLayer = useRef<any>(null)
  const fireLayer = useRef<any>(null)

  const [days, setDays] = useState(30)
  const [live, setLive] = useState<Hazard[]>([])
  const [failed, setFailed] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [shown, setShown] = useState<Record<EventKind, boolean>>({
    earthquake: true,
    volcano: true,
    flood: true,
    storm: true,
    oil: true,
    drought: true,
    wildfire: true,
    heat: true,
  })
  const [showHistoric, setShowHistoric] = useState(true)
  const [showFires, setShowFires] = useState(false)

  // Load live data whenever the time window changes
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    loadHazards(days).then((r) => {
      if (cancelled) return
      setLive(r.items)
      setFailed(r.failed)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [days])

  const visible = useMemo(() => {
    const list = [...live, ...(showHistoric ? HISTORIC : [])]
    return list.filter((h) => shown[h.kind])
  }, [live, showHistoric, shown])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const h of live) c[h.kind] = (c[h.kind] || 0) + 1
    return c
  }, [live])

  // Build the map once
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const L = await import('leaflet')
      if (cancelled || !mapDiv.current || mapRef.current) return
      LRef.current = L
      const map = L.map(mapDiv.current, { center: [20, 10], zoom: 2, minZoom: 2, maxZoom: 9, worldCopyJump: true, zoomSnap: 0.5 })
      mapRef.current = map
      L.tileLayer(`${GIBS}/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg`, {
        maxNativeZoom: 8,
        attribution: 'NASA GIBS Blue Marble · USGS · NASA EONET · GDACS',
      }).addTo(map)
      L.tileLayer(`${GIBS}/wmts/epsg3857/best/Reference_Features_15m/default/GoogleMapsCompatible_Level13/{z}/{y}/{x}.png`, {
        maxNativeZoom: 9,
        opacity: 0.5,
      }).addTo(map)
      fireLayer.current = (L.tileLayer as any).wms(`${GIBS}/wms/epsg3857/best/wms.cgi`, {
        layers: FIRE_LAYER,
        format: 'image/png',
        transparent: true,
        TIME: latestDate(),
      })
      markerLayer.current = L.layerGroup().addTo(map)
      setTimeout(() => map.invalidateSize(), 100)
    })()
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // Draw markers
  useEffect(() => {
    const L = LRef.current
    const layer = markerLayer.current
    if (!L || !layer) return
    layer.clearLayers()
    for (const h of visible) {
      const color = hazardColor(h)
      const r = h.kind === 'earthquake' && h.magnitude ? Math.max(4, (h.magnitude - 3) * 3.2) : 7
      L.circleMarker([h.lat, h.lng], {
        radius: h.historic ? r + 2 : r,
        color: h.historic ? '#ffffff' : h.alert ? ALERT_COLORS[h.alert]?.color || '#111' : '#111827',
        weight: h.historic ? 2 : h.alert && h.alert !== 'Green' ? 3 : 1,
        dashArray: h.historic ? '3 3' : undefined,
        fillColor: color,
        fillOpacity: h.historic ? 0.45 : 0.85,
      })
        .bindPopup(hazardPopup(h))
        .addTo(layer)
    }
  }, [visible, loading])

  // Fire overlay on / off
  useEffect(() => {
    const map = mapRef.current
    if (!map || !fireLayer.current) return
    if (showFires) fireLayer.current.addTo(map)
    else fireLayer.current.remove()
  }, [showFires])

  const recent = useMemo(
    () => [...live].sort((a, b) => (b.date > a.date ? 1 : -1)).filter((h) => shown[h.kind]).slice(0, 40),
    [live, shown]
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-3 items-start">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">Disaster map: floods, earthquakes, volcanoes, oil spills and more</h2>
          <p className="text-sm text-gray-400">
            Live events from USGS, NASA EONET and the UN/EU GDACS system, plus famous events from history (dashed white circles) to compare with.
          </p>
        </div>
        <span className="flex items-center gap-2 text-xs bg-slate-900/60 rounded-full px-3 py-1">
          <span className="live-dot" /> {loading ? 'Loading live data…' : `${live.length} live events`}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 items-center text-sm">
        <span className="text-gray-400">Show the last</span>
        {[7, 30, 365].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1 rounded ${days === d ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-gray-300'}`}
          >
            {d === 365 ? '12 months' : `${d} days`}
          </button>
        ))}
        <label className="flex items-center gap-1 ml-2">
          <input type="checkbox" checked={showHistoric} onChange={(e) => setShowHistoric(e.target.checked)} className="accent-emerald-500" />
          Famous past events
        </label>
        <label className="flex items-center gap-1 ml-2">
          <input type="checkbox" checked={showFires} onChange={(e) => setShowFires(e.target.checked)} className="accent-emerald-500" />
          Yesterday&apos;s fires (VIIRS)
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k}
            onClick={() => setShown((s) => ({ ...s, [k]: !s[k] }))}
            className={`px-3 py-1 rounded-full text-xs border transition ${shown[k] ? 'text-white' : 'text-gray-500 opacity-60'}`}
            style={{ borderColor: EVENT_STYLE[k].color, background: shown[k] ? EVENT_STYLE[k].color + '33' : 'transparent' }}
          >
            {EVENT_STYLE[k].icon} {EVENT_STYLE[k].label} {counts[k] ? `(${counts[k]})` : ''}
          </button>
        ))}
      </div>

      <div className="map-wrap">
        <div ref={mapDiv} className="h-[460px] md:h-[540px] w-full rounded-lg border border-cyan-500/20" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <EventLegend kinds={KINDS} />
        <RampLegend title="Earthquake magnitude" ramp={QUAKE_RAMP} />
      </div>

      {failed.length > 0 && (
        <p className="text-xs text-amber-300">⚠️ Could not reach: {failed.join(', ')}. Those events are missing; try again later.</p>
      )}
      <p className="text-xs text-gray-500">
        Earthquakes: magnitude {days <= 7 ? '4' : days <= 31 ? '4.5' : '6'}+ (smaller ones are too many to show). Oil spills are rarely in live feeds, so most oil
        markers are famous past spills. A thick orange or red ring means GDACS raised an Orange or Red alert.
      </p>

      <div>
        <h3 className="font-bold text-cyan-400 mb-2">Latest events</h3>
        <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
          {recent.map((h) => (
            <button
              key={h.id}
              onClick={() => {
                mapRef.current?.flyTo([h.lat, h.lng], 5, { duration: 1 })
              }}
              className="w-full text-left text-sm bg-slate-900/50 hover:bg-slate-700 rounded px-3 py-1.5 flex gap-2 items-center"
            >
              <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ background: hazardColor(h) }} />
              <span className="flex-1 truncate">{h.title}</span>
              <span className="text-xs text-gray-400 shrink-0">{new Date(h.date).toLocaleDateString()}</span>
            </button>
          ))}
          {!loading && recent.length === 0 && <p className="text-sm text-gray-400">No events of the selected types in this time window.</p>}
        </div>
      </div>
    </div>
  )
}
