'use client'
import { useState } from 'react'

// Real sizes (km). Earth's radius is 6,371 km.
type Layer = {
  id: string
  name: string
  from: number // depth (km) where the layer starts
  to: number // depth (km) where it ends
  state: string
  temp: string
  made: string
  color: string
  fact: string
}

const LAYERS: Layer[] = [
  {
    id: 'crust',
    name: 'Crust',
    from: 0,
    to: 35,
    state: 'Solid rock',
    temp: 'From air temperature at the surface to about 1,000 °C at the bottom',
    made: 'Granite (continents) and basalt (ocean floor)',
    color: '#a16207',
    fact: 'The crust is only 5–10 km thick under oceans and about 35 km (up to 70 km under mountains) under continents. If Earth were an apple, the crust would be thinner than its skin. Earthquakes and volcanoes happen here, where the crust is broken into moving plates.',
  },
  {
    id: 'upper',
    name: 'Upper mantle',
    from: 35,
    to: 660,
    state: 'Solid, but soft and slowly flowing (like very thick toothpaste)',
    temp: 'About 500 – 1,900 °C',
    made: 'Peridotite rock, rich in the green mineral olivine',
    color: '#c2410c',
    fact: 'The plates of the crust slide on top of the soft upper mantle at about the speed your fingernails grow (2–10 cm a year). Magma for most volcanoes melts out of this layer.',
  },
  {
    id: 'lower',
    name: 'Lower mantle',
    from: 660,
    to: 2890,
    state: 'Solid rock under huge pressure',
    temp: 'About 1,900 – 3,700 °C',
    made: 'Bridgmanite – the most common mineral on Earth, which you can never touch',
    color: '#ea580c',
    fact: 'The mantle is 84% of Earth’s volume. Heat escaping from the core makes it churn very slowly, which moves the plates above.',
  },
  {
    id: 'outer',
    name: 'Outer core',
    from: 2890,
    to: 5150,
    state: 'LIQUID metal',
    temp: 'About 4,000 – 5,000 °C',
    made: 'Molten iron and nickel',
    color: '#f59e0b',
    fact: 'THIS IS WHERE THE MAGNETIC FIELD BEGINS. Hot liquid iron rises, cools and sinks again, and Earth’s spin twists these flows into spirals. Moving metal carries electric currents, and electric currents make a magnetic field. Scientists call this machine the "geodynamo".',
  },
  {
    id: 'inner',
    name: 'Inner core',
    from: 5150,
    to: 6371,
    state: 'Solid metal ball (the pressure is too high for it to melt)',
    temp: 'About 5,200 °C – roughly as hot as the surface of the Sun',
    made: 'Iron and nickel',
    color: '#fde68a',
    fact: 'The inner core is about 2,440 km wide – roughly the size of the Moon. As it slowly grows by freezing iron out of the outer core, it releases heat that keeps the geodynamo running.',
  },
]

const R = 6371

export default function EarthLayers() {
  const [sel, setSel] = useState<string>('outer')
  const [showField, setShowField] = useState(true)
  const layer = LAYERS.find((l) => l.id === sel)!

  // Drawing: 1 km = scale px; the crust is drawn thicker than real so you can see it
  const S = 190
  const radius = (depth: number) => (S * (R - depth)) / R
  const cx = 220
  const cy = 220

  return (
    <div className="bg-slate-900/40 rounded-lg p-4 border border-cyan-500/20">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="text-lg font-bold text-cyan-400">Inside the Earth: where the magnetic field begins</h3>
          <p className="text-sm text-gray-400">Click a layer to explore it. Layer sizes are drawn to scale (except the crust, which is too thin to see).</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={showField} onChange={(e) => setShowField(e.target.checked)} className="accent-emerald-500" />
          Show magnetic field lines
        </label>
      </div>

      <div className="grid md:grid-cols-[minmax(0,440px)_1fr] gap-5 items-center">
        <svg viewBox="0 0 440 440" className="w-full h-auto" role="img" aria-label="Cross-section of the Earth showing crust, mantle, outer core and inner core">
          <defs>
            <radialGradient id="innerGlow">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="100%" stopColor="#fbbf24" />
            </radialGradient>
            <clipPath id="halfCut">
              <rect x={cx} y="0" width="240" height="440" />
            </clipPath>
            <style>{`
              @keyframes flow { to { stroke-dashoffset: -40; } }
              @keyframes spin { to { transform: rotate(360deg); } }
              .fieldline { animation: flow 2.5s linear infinite; }
              .swirl { transform-origin: ${cx}px ${cy}px; animation: spin 18s linear infinite; }
              @media (prefers-reduced-motion: reduce) { .fieldline, .swirl { animation: none; } }
            `}</style>
          </defs>

          {/* Magnetic field lines: a dipole coming out of the core, through the surface, into space */}
          {showField &&
            [1.25, 1.6, 2.1, 2.9].map((L, i) => {
              const pts: string[] = []
              for (let t = -80; t <= 80; t += 4) {
                const lat = (t * Math.PI) / 180
                const r = L * Math.cos(lat) ** 2 * S
                pts.push(`${cx + r * Math.cos(lat)},${cy - r * Math.sin(lat)}`)
              }
              const right = 'M' + pts.join(' L')
              const left = 'M' + pts.map((p) => p.split(',')).map(([x, y]) => `${2 * cx - Number(x)},${y}`).join(' L')
              return (
                <g key={i} opacity={0.75 - i * 0.12}>
                  <path d={right} fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="6 4" className="fieldline" />
                  <path d={left} fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="6 4" className="fieldline" />
                </g>
              )
            })}

          {/* Whole Earth (outside view) on the left half */}
          <circle cx={cx} cy={cy} r={S} fill="#1d4ed8" />
          <path d={`M${cx},${cy - S} A${S},${S} 0 0 0 ${cx},${cy + S}`} fill="#15803d" opacity="0.35" />

          {/* Cut-away on the right half */}
          <g clipPath="url(#halfCut)">
            {LAYERS.map((l) => {
              const outer = l.id === 'crust' ? S : l.id === 'upper' ? S - 5 : radius(l.from)
              return (
                <circle
                  key={l.id}
                  cx={cx}
                  cy={cy}
                  r={outer}
                  fill={l.id === 'inner' ? 'url(#innerGlow)' : l.color}
                  stroke={sel === l.id ? '#ffffff' : 'rgba(0,0,0,0.35)'}
                  strokeWidth={sel === l.id ? 2.5 : 1}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSel(l.id)}
                >
                  <title>{l.name}</title>
                </circle>
              )
            })}
            {/* swirling liquid iron in the outer core */}
            <g className="swirl" pointerEvents="none">
              {[0, 60, 120, 180, 240, 300].map((a) => {
                const rr = (radius(2890) + radius(5150)) / 2
                const x = cx + rr * Math.cos((a * Math.PI) / 180)
                const y = cy + rr * Math.sin((a * Math.PI) / 180)
                return <circle key={a} cx={x} cy={y} r="9" fill="none" stroke="#7c2d12" strokeWidth="2" strokeDasharray="10 5" opacity="0.7" />
              })}
            </g>
          </g>

          {/* Labels with depths */}
          {/* Thin outer layers: labels outside the globe with pointer lines */}
          {[
            { id: 'crust', tx: 318, ty: 22, px: cx + S * 0.6, py: cy - S * 0.8, text: 'Crust 0–35 km' },
            { id: 'upper', tx: 336, ty: 40, px: cx + (S - 8) * 0.68, py: cy - (S - 8) * 0.733, text: 'Upper mantle' },
          ].map((t) => (
            <g key={t.id} style={{ cursor: 'pointer' }} onClick={() => setSel(t.id)}>
              <line x1={t.tx - 4} y1={t.ty - 4} x2={t.px} y2={t.py} stroke={sel === t.id ? '#ffffff' : '#9ca3af'} strokeWidth="1" />
              <circle cx={t.px} cy={t.py} r="2.5" fill={sel === t.id ? '#ffffff' : '#9ca3af'} />
              <text x={t.tx} y={t.ty} fontSize="11" fontWeight="700" fill={sel === t.id ? '#ffffff' : '#d1d5db'}>
                {t.text}
              </text>
            </g>
          ))}
          {[
            { id: 'lower', y: cy - radius(1800), text: 'Lower mantle' },
            { id: 'outer', y: cy - radius(4000), text: 'Outer core ⚡ field starts here' },
            { id: 'inner', y: cy - radius(5700), text: 'Inner core' },
          ].map((t) => (
            <text
              key={t.id}
              x={cx + 6}
              y={t.y}
              fontSize="11"
              fill={sel === t.id ? '#ffffff' : '#111827'}
              fontWeight="700"
              style={{ cursor: 'pointer' }}
              onClick={() => setSel(t.id)}
            >
              {t.text}
            </text>
          ))}
          <text x={cx} y={cy - S - 12} textAnchor="middle" fill="#e5e7eb" fontSize="12">
            N
          </text>
          <text x={cx} y={cy + S + 22} textAnchor="middle" fill="#e5e7eb" fontSize="12">
            S
          </text>
        </svg>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {LAYERS.map((l) => (
              <button
                key={l.id}
                onClick={() => setSel(l.id)}
                className={`px-3 py-1 rounded text-sm ${sel === l.id ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-gray-300'}`}
              >
                {l.name}
              </button>
            ))}
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border-l-4" style={{ borderColor: layer.color }}>
            <h4 className="text-xl font-bold" style={{ color: layer.color }}>
              {layer.name}
            </h4>
            <p className="text-sm text-gray-400 mb-2">
              {layer.from.toLocaleString()} – {layer.to.toLocaleString()} km below your feet ·{' '}
              {(layer.to - layer.from).toLocaleString()} km thick
            </p>
            <dl className="text-sm space-y-1 text-gray-200">
              <div>
                <dt className="inline font-semibold">State: </dt>
                <dd className="inline">{layer.state}</dd>
              </div>
              <div>
                <dt className="inline font-semibold">Temperature: </dt>
                <dd className="inline">{layer.temp}</dd>
              </div>
              <div>
                <dt className="inline font-semibold">Made of: </dt>
                <dd className="inline">{layer.made}</dd>
              </div>
            </dl>
            <p className="text-sm text-gray-300 mt-2">{layer.fact}</p>
          </div>
          <div className="text-xs text-gray-400 bg-slate-800/60 rounded p-3 space-y-1">
            <p>
              🧲 <b className="text-gray-200">From the core to space:</b> the field made in the outer core passes through 2,900 km of rock, comes out of the ground and
              stretches tens of thousands of kilometres into space, where it becomes the magnetosphere you can play with below.
            </p>
            <p>
              🧭 At the surface it is weak (about 25–65 microtesla, roughly 100 times weaker than a fridge magnet), but strong enough to turn a compass needle. The
              magnetic north pole wanders – in recent decades it has moved from Canada towards Siberia by tens of kilometres a year.
            </p>
            <p>🔄 The field has flipped north-to-south many times. The last full flip was about 780,000 years ago.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
