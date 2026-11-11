// One place for every colour that carries a meaning in the app.
// The legends (ColorLegend.tsx) read from here, so a map and its legend can never disagree.

export type EventKind = 'wildfire' | 'earthquake' | 'volcano' | 'flood' | 'storm' | 'oil' | 'drought' | 'heat'

export const EVENT_STYLE: Record<EventKind, { label: string; icon: string; color: string; note: string }> = {
  wildfire: { label: 'Wildfire / heat spot', icon: '🔥', color: '#ef4444', note: 'Fires seen by MODIS and VIIRS' },
  earthquake: { label: 'Earthquake', icon: '🌐', color: '#facc15', note: 'Colour changes with magnitude (see ramp)' },
  volcano: { label: 'Volcanic eruption', icon: '🌋', color: '#e879f9', note: 'Active or erupting volcano' },
  flood: { label: 'Flood', icon: '🌊', color: '#3b82f6', note: 'River, flash or coastal flooding' },
  storm: { label: 'Cyclone / severe storm', icon: '🌀', color: '#22d3ee', note: 'Hurricanes, typhoons, cyclones' },
  oil: { label: 'Oil spill', icon: '🛢️', color: '#a16207', note: 'Oil released into the sea or land' },
  drought: { label: 'Drought', icon: '🏜️', color: '#d97706', note: 'Long dry period' },
  heat: { label: 'Heatwave', icon: '🌡️', color: '#f43f5e', note: 'Days much hotter than normal' },
}

export type RampStop = { value: number; color: string; label: string }

/** Earthquake magnitude: yellow-green for small, purple for the biggest. */
export const QUAKE_RAMP: RampStop[] = [
  { value: 0, color: '#a3e635', label: 'below 4' },
  { value: 4, color: '#facc15', label: '4 – 5' },
  { value: 5, color: '#fb923c', label: '5 – 6' },
  { value: 6, color: '#ef4444', label: '6 – 7' },
  { value: 7, color: '#c026d3', label: '7 and above' },
]

/** Fire activity (heat map): dark purple = no fire, yellow-white = the most fire. */
export const FIRE_RAMP: RampStop[] = [
  { value: 0, color: '#1e1b4b', label: 'none' },
  { value: 0.05, color: '#4c1d95', label: 'very low' },
  { value: 0.15, color: '#9d174d', label: 'low' },
  { value: 0.3, color: '#dc2626', label: 'medium' },
  { value: 0.5, color: '#f97316', label: 'high' },
  { value: 0.75, color: '#facc15', label: 'very high' },
  { value: 1, color: '#fef9c3', label: 'extreme' },
]

/** NOAA Kp index (geomagnetic activity). */
export const KP_RAMP: RampStop[] = [
  { value: 0, color: '#34d399', label: '0 – 3 quiet' },
  { value: 4, color: '#facc15', label: '4 active' },
  { value: 5, color: '#fb923c', label: '5 storm (G1)' },
  { value: 6, color: '#ef4444', label: '6 – 7 strong storm' },
  { value: 8, color: '#a855f7', label: '8 – 9 severe storm' },
]

/** Alert levels used by GDACS (the UN / EU Global Disaster Alert and Coordination System). */
export const ALERT_COLORS: Record<string, { color: string; meaning: string }> = {
  Green: { color: '#22c55e', meaning: 'Small impact expected – no international help needed' },
  Orange: { color: '#f97316', meaning: 'Medium impact – international help may be needed' },
  Red: { color: '#dc2626', meaning: 'Severe impact – international help likely needed' },
}

/** Pick the colour of the highest ramp stop that the value reaches. */
export function rampColor(ramp: RampStop[], value: number): string {
  let c = ramp[0].color
  for (const s of ramp) if (value >= s.value) c = s.color
  return c
}

/** Smoothly blend through a ramp for a value between 0 and 1 (used for heat maps). */
export function rampBlend(ramp: RampStop[], t: number): string {
  const v = Math.max(0, Math.min(1, t))
  for (let i = 1; i < ramp.length; i++) {
    const a = ramp[i - 1]
    const b = ramp[i]
    if (v <= b.value) {
      const k = (v - a.value) / (b.value - a.value || 1)
      return mix(a.color, b.color, k)
    }
  }
  return ramp[ramp.length - 1].color
}

function mix(a: string, b: string, k: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16))
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16))
  return '#' + pa.map((x, i) => Math.round(x + (pb[i] - x) * k).toString(16).padStart(2, '0')).join('')
}
