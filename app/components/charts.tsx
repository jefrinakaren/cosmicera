'use client'
// Small, dependency-free SVG charts. The SVG scales to the width of its box.

import { useState } from 'react'

const AXIS = '#9ca3af'
const GRID = 'rgba(255,255,255,0.08)'

function niceMax(v: number) {
  if (v <= 0) return 1
  const p = Math.pow(10, Math.floor(Math.log10(v)))
  for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p
  return 10 * p
}

export function defaultFormat(v: number) {
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(v >= 1e7 ? 0 : 1) + 'M'
  if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(v >= 1e4 ? 0 : 1) + 'k'
  return Number.isInteger(v) ? String(v) : v.toFixed(1)
}

type Bar = { label: string; value: number | null; color?: string; note?: string }

/** Vertical bar chart. Bars can be grouped: pass `series` instead of `data`. */
export function BarChart({
  data,
  series,
  labels,
  height = 260,
  format = defaultFormat,
  unit = '',
  highlightMax = false,
}: {
  data?: Bar[]
  series?: { name: string; color: string; values: (number | null)[] }[]
  labels?: string[]
  height?: number
  format?: (v: number) => string
  unit?: string
  highlightMax?: boolean
}) {
  const [hover, setHover] = useState<string | null>(null)
  const W = 800
  const H = height
  const pad = { l: 52, r: 10, t: 14, b: 42 }
  const groups: { label: string; bars: { name: string; value: number | null; color: string; note?: string }[] }[] = data
    ? data.map((d) => ({ label: d.label, bars: [{ name: d.label, value: d.value, color: d.color || '#34d399', note: d.note }] }))
    : (labels || []).map((label, i) => ({
        label,
        bars: (series || []).map((s) => ({ name: s.name, value: s.values[i], color: s.color })),
      }))
  const all = groups.flatMap((g) => g.bars.map((b) => b.value ?? 0))
  const max = niceMax(Math.max(0, ...all))
  const maxVal = Math.max(...all)
  const iw = W - pad.l - pad.r
  const ih = H - pad.t - pad.b
  const gw = iw / Math.max(1, groups.length)
  const bw = Math.max(2, (gw * 0.8) / Math.max(1, groups[0]?.bars.length || 1))
  const y = (v: number) => pad.t + ih - (v / max) * ih
  const every = Math.ceil(groups.length / 14)

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={pad.l} x2={W - pad.r} y1={y(max * f)} y2={y(max * f)} stroke={GRID} />
            <text x={pad.l - 6} y={y(max * f) + 4} fill={AXIS} fontSize="11" textAnchor="end">
              {format(max * f)}
            </text>
          </g>
        ))}
        {groups.map((g, gi) => (
          <g key={g.label}>
            {g.bars.map((b, bi) => {
              if (b.value === null || b.value === undefined) return null
              const x = pad.l + gi * gw + gw * 0.1 + bi * bw
              const isMax = highlightMax && b.value === maxVal
              const key = `${g.label}|${b.name}`
              return (
                <rect
                  key={bi}
                  x={x}
                  y={y(b.value)}
                  width={bw - 1}
                  height={Math.max(0, pad.t + ih - y(b.value))}
                  fill={b.color}
                  opacity={hover && hover !== key ? 0.55 : 1}
                  stroke={isMax ? '#fff' : 'none'}
                  strokeWidth={isMax ? 1.5 : 0}
                  onMouseEnter={() => setHover(key)}
                  onMouseLeave={() => setHover(null)}
                >
                  <title>{`${g.label}${series ? ' – ' + b.name : ''}: ${format(b.value)}${unit ? ' ' + unit : ''}${b.note ? ' (' + b.note + ')' : ''}`}</title>
                </rect>
              )
            })}
            {gi % every === 0 && (
              <text x={pad.l + gi * gw + gw / 2} y={H - pad.b + 16} fill={AXIS} fontSize="11" textAnchor="middle">
                {g.label}
              </text>
            )}
          </g>
        ))}
        <line x1={pad.l} x2={W - pad.r} y1={pad.t + ih} y2={pad.t + ih} stroke={AXIS} />
      </svg>
      {series && (
        <div className="flex flex-wrap gap-3 text-xs text-gray-300 mt-1">
          {series.map((s) => (
            <span key={s.name} className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: s.color }} /> {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/** Line chart with several series sharing one x axis. */
export function LineChart({
  labels,
  series,
  height = 260,
  format = defaultFormat,
  band,
}: {
  labels: string[]
  series: { name: string; color: string; values: (number | null)[]; width?: number; dashed?: boolean }[]
  height?: number
  format?: (v: number) => string
  /** optional shaded range (e.g. lowest to highest year) */
  band?: { lo: (number | null)[]; hi: (number | null)[]; color: string; name: string }
}) {
  const [hoverI, setHoverI] = useState<number | null>(null)
  const W = 800
  const H = height
  const pad = { l: 52, r: 12, t: 14, b: 32 }
  const vals = series.flatMap((s) => s.values).concat(band ? band.hi : [])
  const max = niceMax(Math.max(0, ...vals.filter((v): v is number => v !== null && v !== undefined)))
  const iw = W - pad.l - pad.r
  const ih = H - pad.t - pad.b
  const n = labels.length
  const x = (i: number) => pad.l + (n <= 1 ? 0 : (i / (n - 1)) * iw)
  const y = (v: number) => pad.t + ih - (v / max) * ih
  const path = (vs: (number | null)[]) => {
    let d = ''
    let pen = false
    vs.forEach((v, i) => {
      if (v === null || v === undefined) {
        pen = false
        return
      }
      d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)} `
      pen = true
    })
    return d
  }
  const bandPath = () => {
    if (!band) return ''
    const idx = band.hi.map((v, i) => (v !== null && band.lo[i] !== null ? i : -1)).filter((i) => i >= 0)
    if (!idx.length) return ''
    const top = idx.map((i) => `${x(i)},${y(band.hi[i] as number)}`).join(' L')
    const bot = [...idx].reverse().map((i) => `${x(i)},${y(band.lo[i] as number)}`).join(' L')
    return `M${top} L${bot} Z`
  }
  const every = Math.ceil(n / 12)

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        onMouseLeave={() => setHoverI(null)}
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
          const px = ((e.clientX - r.left) / r.width) * W
          const i = Math.round(((px - pad.l) / iw) * (n - 1))
          setHoverI(i >= 0 && i < n ? i : null)
        }}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={pad.l} x2={W - pad.r} y1={y(max * f)} y2={y(max * f)} stroke={GRID} />
            <text x={pad.l - 6} y={y(max * f) + 4} fill={AXIS} fontSize="11" textAnchor="end">
              {format(max * f)}
            </text>
          </g>
        ))}
        {band && <path d={bandPath()} fill={band.color} opacity={0.25} />}
        {series.map((s) => (
          <path
            key={s.name}
            d={path(s.values)}
            fill="none"
            stroke={s.color}
            strokeWidth={s.width || 2}
            strokeDasharray={s.dashed ? '6 4' : undefined}
          />
        ))}
        {labels.map((l, i) =>
          i % every === 0 ? (
            <text key={i} x={x(i)} y={H - 10} fill={AXIS} fontSize="11" textAnchor="middle">
              {l}
            </text>
          ) : null
        )}
        {hoverI !== null && <line x1={x(hoverI)} x2={x(hoverI)} y1={pad.t} y2={pad.t + ih} stroke="rgba(255,255,255,0.35)" />}
      </svg>
      <div className="flex flex-wrap gap-3 text-xs text-gray-300 mt-1 min-h-[1.25rem]">
        {series.map((s) => (
          <span key={s.name} className="flex items-center gap-1">
            <span className="inline-block w-4 h-0.5" style={{ background: s.color }} />
            {s.name}
            {hoverI !== null && s.values[hoverI] !== null && s.values[hoverI] !== undefined && (
              <b className="text-white ml-1">{format(s.values[hoverI] as number)}</b>
            )}
          </span>
        ))}
        {band && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-3" style={{ background: band.color, opacity: 0.4 }} /> {band.name}
          </span>
        )}
        {hoverI !== null && <span className="text-gray-400">· {labels[hoverI]}</span>}
      </div>
    </div>
  )
}

/** Table-like heat map: rows x columns of coloured cells. */
export function Heatmap({
  rows,
  cols,
  color,
  format = defaultFormat,
}: {
  rows: { label: string; values: (number | null)[] }[]
  cols: string[]
  color: (v: number) => string
  format?: (v: number) => string
}) {
  return (
    <div className="overflow-x-auto">
      <table className="text-[10px] border-separate !w-auto mx-auto" style={{ borderSpacing: 2 }}>
        <thead>
          <tr>
            <th className="!p-0 !bg-transparent" />
            {cols.map((c) => (
              <th key={c} className="!p-0 !bg-transparent text-gray-400 font-normal text-center w-8">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="hover:!bg-transparent">
              <td className="!p-0 !border-0 pr-2 text-gray-300 text-right whitespace-nowrap">{r.label}</td>
              {r.values.map((v, i) => (
                <td
                  key={i}
                  className="!p-0 !border-0 h-5 w-8 rounded-sm"
                  style={{ background: v === null ? 'rgba(255,255,255,0.04)' : color(v) }}
                  title={`${r.label} ${cols[i]}: ${v === null ? 'no data' : format(v)}`}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
