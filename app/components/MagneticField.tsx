'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import MagnetosphereSim, { magnetopauseDistance } from './MagnetosphereSim'
import { KpPoint, SolarWind, StormScale, fetchKpHistory, fetchSolarWind, fetchStormScale, liveImages } from '../lib/noaa'

const kpHex = (kp: number) => (kp < 2 ? '#22c55e' : kp < 4 ? '#34d399' : kp < 5 ? '#facc15' : kp < 7 ? '#fb923c' : '#ef4444')

function kpLabel(kp: number) {
  if (kp < 2) return 'Quiet'
  if (kp < 4) return 'Unsettled'
  if (kp < 5) return 'Active'
  if (kp < 6) return 'Minor storm (G1)'
  if (kp < 7) return 'Moderate storm (G2)'
  if (kp < 8) return 'Strong storm (G3)'
  if (kp < 9) return 'Severe storm (G4)'
  return 'Extreme storm (G5)'
}

const AURORA_ZONES = [
  { zone: 'Far North (65-75°N)', minKp: 2, yes: '✓ Visible' },
  { zone: 'North (55-65°N)', minKp: 5, yes: '✓ Visible' },
  { zone: 'Mid-North (45-55°N)', minKp: 7, yes: 'Possible' },
  { zone: 'Lower Mid (35-45°N)', minKp: 9, yes: 'Rare' },
]

type Mode = 'live' | 'custom' | 'storm'

export default function MagneticField() {
  const [history, setHistory] = useState<KpPoint[]>([])
  const [wind, setWind] = useState<SolarWind | null>(null)
  const [scale, setScale] = useState<StormScale | null>(null)
  const [status, setStatus] = useState<'loading' | 'live' | 'error'>('loading')
  const [updated, setUpdated] = useState<Date | null>(null)
  const [tick, setTick] = useState(() => Math.floor(Date.now() / 600000))
  const [imgFail, setImgFail] = useState<Record<string, boolean>>({})

  const [mode, setMode] = useState<Mode>('live')
  const [customSpeed, setCustomSpeed] = useState(420)
  const [customBz, setCustomBz] = useState(0)
  const stormTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    try {
      const [kp, sw, sc] = await Promise.all([fetchKpHistory(), fetchSolarWind(), fetchStormScale().catch(() => null)])
      setHistory(kp)
      setWind(sw)
      setScale(sc)
      setStatus('live')
      setUpdated(new Date())
    } catch {
      setStatus((s) => (s === 'live' ? 'live' : 'error'))
    }
    setTick(Math.floor(Date.now() / 600000))
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 60000)
    return () => {
      clearInterval(id)
      if (stormTimer.current) clearTimeout(stormTimer.current)
    }
  }, [load])

  const kpNow = history.length ? history[history.length - 1].kp : 2
  const liveSpeed = wind?.speed ?? 400
  const liveBz = wind?.bz ?? 0

  const simSpeed = mode === 'live' ? liveSpeed : mode === 'storm' ? 950 : customSpeed
  const simBz = mode === 'live' ? liveBz : mode === 'storm' ? -16 : customBz
  const simKp = mode === 'storm' ? 8 : mode === 'custom' ? clampKp(customSpeed, customBz) : kpNow

  const { r0 } = magnetopauseDistance(simSpeed, simBz)
  const calm = magnetopauseDistance(400, 0).r0
  const squeeze = Math.max(0, Math.round((1 - r0 / calm) * 100))

  const launchStorm = () => {
    if (stormTimer.current) clearTimeout(stormTimer.current)
    setMode('storm')
    stormTimer.current = setTimeout(() => setMode('live'), 15000)
  }
  const useLive = () => {
    if (stormTimer.current) clearTimeout(stormTimer.current)
    setMode('live')
  }
  const onSpeed = (v: number) => {
    if (stormTimer.current) clearTimeout(stormTimer.current)
    setCustomSpeed(v)
    if (mode !== 'custom') setCustomBz(mode === 'storm' ? -16 : Math.round(liveBz))
    setMode('custom')
  }
  const onBz = (v: number) => {
    if (stormTimer.current) clearTimeout(stormTimer.current)
    setCustomBz(v)
    if (mode !== 'custom') setCustomSpeed(mode === 'storm' ? 950 : Math.round(liveSpeed))
    setMode('custom')
  }

  const images = liveImages(tick)
  const bars = history.slice(-56)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">Earth&apos;s magnetic shield, live</h2>
          <p className="text-sm text-gray-400">
            Earth has a giant invisible magnetic bubble that protects us from the Sun&apos;s particles. See what it is doing right now.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-300 bg-slate-700/60 rounded-full px-3 py-1 self-start">
          {status === 'live' ? <span className="live-dot" /> : <span className="w-2 h-2 rounded-full bg-yellow-400" />}
          {status === 'live' && updated
            ? `Live NOAA data · updated ${updated.toISOString().slice(11, 16)} UTC`
            : status === 'loading'
            ? 'Loading NOAA data…'
            : 'NOAA is unreachable: showing typical values'}
        </div>
      </div>

      {/* Live numbers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-lg border-2 text-center animate-glow bg-slate-800" style={{ borderColor: kpHex(kpNow) }}>
          <p className="text-gray-400 text-sm mb-1">Kp Index right now</p>
          <div className="text-6xl font-bold" style={{ color: kpHex(kpNow) }}>{kpNow.toFixed(1)}</div>
          <p className="text-gray-300 mt-1 font-semibold">{kpLabel(kpNow)}</p>
          <p className="text-xs text-gray-500 mt-1">
            0 = calm, 9 = extreme{scale ? ` · NOAA storm scale: G${scale.level} (${scale.text})` : ''}
          </p>
        </div>

        <div className="p-5 rounded-lg bg-slate-700/50">
          <p className="text-gray-400 text-sm mb-1">☀️ Solar wind speed</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-orange-400">{wind?.speed != null ? Math.round(wind.speed) : '—'}</span>
            <span className="text-gray-500 text-sm mb-1">km/s</span>
          </div>
          <div className="w-full bg-slate-600 h-2 rounded mt-3">
            <div className="bg-orange-500 h-2 rounded" style={{ width: `${Math.min(100, Math.max(0, (((wind?.speed ?? 0) - 250) / 650) * 100))}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {wind?.speed == null ? '' : wind.speed < 400 ? 'Slow and gentle.' : wind.speed < 600 ? 'Normal to fast.' : 'Very fast! A stream of particles from the Sun is hitting us.'}
          </p>
        </div>

        <div className="p-5 rounded-lg bg-slate-700/50">
          <p className="text-gray-400 text-sm mb-1">🧲 Sun&apos;s magnetic field (Bz)</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold" style={{ color: (wind?.bz ?? 0) < 0 ? '#f87171' : '#a78bfa' }}>
              {wind?.bz != null ? wind.bz : '—'}
            </span>
            <span className="text-gray-500 text-sm mb-1">nT</span>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            {wind?.bz == null
              ? ''
              : wind.bz < 0
              ? 'Points SOUTH: opposite to Earth’s field, so the solar wind can plug into our shield. This is what powers storms.'
              : 'Points NORTH: the same way as Earth’s field, so our shield stays tightly closed.'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total strength: {wind?.bt ?? '—'} nT</p>
        </div>
      </div>

      {/* Kp history */}
      {bars.length > 0 && (
        <div className="bg-slate-700/40 p-4 rounded-lg">
          <h3 className="font-bold text-cyan-400 mb-1">The last 7 days</h3>
          <p className="text-xs text-gray-500 mb-3">Each bar is 3 hours of Kp. Bars above the dashed line (Kp 5) are geomagnetic storms.</p>
          <svg viewBox="0 0 560 150" className="w-full h-auto" role="img" aria-label="Bar chart of the Kp index over the last seven days">
            {bars.map((b, i) => {
              const bw = 560 / bars.length
              const hgt = (b.kp / 9) * 110
              return <rect key={b.time} x={i * bw + 1} y={120 - hgt} width={bw - 2} height={hgt} rx={2} fill={kpHex(b.kp)}><title>{`${b.time.replace('T', ' ')} UTC: Kp ${b.kp.toFixed(1)}`}</title></rect>
            })}
            <line x1="0" x2="560" y1={120 - (5 / 9) * 110} y2={120 - (5 / 9) * 110} stroke="#9ca3af" strokeDasharray="4 4" strokeWidth="1" />
            <text x="2" y={120 - (5 / 9) * 110 - 3} fill="#9ca3af" fontSize="9">storm level (Kp 5)</text>
            <line x1="0" x2="560" y1="120" y2="120" stroke="#6b7280" strokeWidth="1" />
            <text x="0" y="138" fill="#9ca3af" fontSize="10">{bars[0].time.slice(5, 10)}</text>
            <text x="560" y="138" fill="#9ca3af" fontSize="10" textAnchor="end">now</text>
          </svg>
        </div>
      )}

      {/* Simulator */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-bold text-cyan-400">What happens to the magnetic field in a solar storm?</h3>
          <p className="text-sm text-gray-400">
            The yellow dots are the solar wind. Earth&apos;s magnetic field (purple lines) pushes it aside, but a strong wind squeezes the field on the Sun side and stretches it into a long tail on the night side.
            Try it yourself!
          </p>
        </div>

        <MagnetosphereSim speed={simSpeed} bz={simBz} kp={simKp} height={400} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 bg-slate-700/40 p-4 rounded-lg">
            <label className="block text-sm">
              <span className="text-gray-300">Solar wind speed: <strong className="text-orange-400">{Math.round(simSpeed)} km/s</strong></span>
              <input type="range" min={250} max={1000} step={10} value={Math.round(simSpeed)} onChange={(e) => onSpeed(Number(e.target.value))} className="w-full accent-emerald-400" />
            </label>
            <label className="block text-sm">
              <span className="text-gray-300">
                Sun&apos;s field direction (Bz): <strong style={{ color: simBz < 0 ? '#f87171' : '#a78bfa' }}>{simBz.toFixed(0)} nT {simBz < 0 ? '(south)' : '(north)'}</strong>
              </span>
              <input type="range" min={-20} max={20} step={1} value={Math.round(simBz)} onChange={(e) => onBz(Number(e.target.value))} className="w-full accent-emerald-400" />
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              <button onClick={launchStorm} className="px-4 py-2 rounded bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm">
                ☀️ Launch a solar storm
              </button>
              <button onClick={useLive} disabled={mode === 'live'} className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-700 text-white text-sm disabled:opacity-40">
                Use live data now
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {mode === 'live' ? 'Showing today’s real solar wind.' : mode === 'storm' ? 'Simulated super-storm (returns to live data in 15 seconds).' : 'Your own settings.'}
            </p>
          </div>

          <div className="bg-slate-700/40 p-4 rounded-lg space-y-2 text-sm">
            <p className="text-gray-300">
              The magnetic bubble reaches <strong className="text-cyan-400 text-lg">{r0.toFixed(1)}</strong> Earth radii towards the Sun.
            </p>
            <p className="text-gray-400">
              {squeeze > 0 ? `That is ${squeeze}% smaller than on a calm day (${calm.toFixed(1)}).` : 'That is as big as, or bigger than, on a calm day.'}
            </p>
            {r0 < 6.6 && (
              <p className="text-red-300">
                ⚠️ Smaller than 6.6! Satellites in geostationary orbit (TV and weather satellites) would be outside the shield and exposed to radiation.
              </p>
            )}
            {simBz < -5 && r0 >= 6.6 && <p className="text-orange-300">The southward field opens the shield, so particles pour in at the poles and make bright auroras.</p>}
            {simBz >= -5 && simSpeed > 600 && <p className="text-yellow-300">A fast wind squeezes the shield, but a northward field keeps it closed, so the storm is weak.</p>}
            <p className="text-xs text-gray-500">
              Model: Shue et al. (1998) magnetopause with an assumed solar wind density of 5 protons per cm³. A simplified picture, not to scale.
            </p>
          </div>
        </div>
      </div>

      {/* Daily photos */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-bold text-cyan-400">Photos that update by themselves</h3>
          <p className="text-sm text-gray-400">These pictures come straight from NOAA and NASA. Reload the page and you will see the newest ones.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { key: 'auroraNorth', src: images.auroraNorth, title: '🌌 Northern lights forecast', note: 'Green = where aurora can be seen in the next 30-90 minutes. Source: NOAA SWPC.' },
            { key: 'auroraSouth', src: images.auroraSouth, title: '🌌 Southern lights forecast', note: 'The same forecast for the south pole. Source: NOAA SWPC.' },
            { key: 'sunCorona', src: images.sunCorona, title: '☀️ The Sun’s hot atmosphere', note: 'Extreme ultraviolet light (193 Å): bright arches are magnetic loops. Source: NASA SDO.' },
            { key: 'sunSpots', src: images.sunSpots, title: '☀️ The Sun’s surface', note: 'Dark spots are where the Sun’s magnetic field is strongest, where storms are born. Source: NASA SDO.' },
          ].map((img) => (
            <figure key={img.key} className="bg-slate-800 rounded-lg overflow-hidden border border-cyan-500/20">
              <a href={img.src} target="_blank" rel="noopener noreferrer" className="block aspect-square bg-slate-900">
                {imgFail[img.key] ? (
                  <span className="flex h-full items-center justify-center text-sm text-gray-500 px-4 text-center">Image unavailable right now</span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img.src}
                    alt={img.title}
                    className="w-full h-full object-cover"
                    onError={() => setImgFail((f) => ({ ...f, [img.key]: true }))}
                  />
                )}
              </a>
              <figcaption className="p-3">
                <div className="text-sm font-semibold text-gray-100">{img.title}</div>
                <p className="text-xs text-gray-400 mt-1">{img.note}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      {/* Aurora forecast */}
      <div className="bg-slate-700/50 p-4 rounded-lg">
        <h3 className="font-bold text-cyan-400 mb-1">Can I see the aurora tonight?</h3>
        <p className="text-xs text-gray-500 mb-4">Based on today&apos;s Kp ({kpNow.toFixed(1)}). Approximate: the stronger the storm, the further south the aurora reaches.</p>
        <div className="space-y-2 text-sm">
          {AURORA_ZONES.map((z) => (
            <div key={z.zone} className="flex justify-between">
              <span>{z.zone}</span>
              <span className={kpNow >= z.minKp ? 'text-green-400' : 'text-gray-500'}>{kpNow >= z.minKp ? z.yes : 'Not visible'}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Data: NOAA Space Weather Prediction Center (Kp index, solar wind, aurora forecast) and NASA Solar Dynamics Observatory (Sun images). The animation is a simplified model for learning.
      </p>
    </div>
  )
}

// A rough Kp for the "custom" sliders: faster wind and a southward field give a bigger storm
function clampKp(speed: number, bz: number) {
  const v = (speed - 300) / 100 + Math.max(0, -bz) / 4
  return Math.max(0, Math.min(9, v))
}
