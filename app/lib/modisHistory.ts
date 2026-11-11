// 25 years of MODIS fire history, measured by this project.
//
// How it was made: for 2 sample days in every month from January 2001 to October 2026
// (the 8th and the 22nd), we downloaded NASA's world map of MODIS Terra fire detections
// (GIBS layer MODIS_Terra_Thermal_Anomalies_All, 2048 x 1024 pixels) and counted the
// pixels marked as fire - in the whole world, in each of the 8 hotspot regions, and in
// every 10° x 10° square of the globe. The result is saved in modis-history.json.
//
// One pixel is about 0.18° x 0.18° (about 20 km x 20 km at the equator), so the numbers are
// a "fire index", not an exact count of fires. Because the same instrument and the same
// method are used for every year, years and months can be compared fairly.

import raw from './modis-history.json'

type Raw = {
  meta: { regions: string[]; sampleDays: number[]; generated: string; gridDeg: number }
  months: (number | null)[][] // [year, month, world, ...regions]
  grid: Record<string, number[]> // year -> 36 x 18 cells (row 0 = 90°N..80°N, col 0 = 180°W..170°W)
}

const data = raw as unknown as Raw

export const HISTORY_REGIONS: string[] = data.meta.regions
export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const HISTORY_GENERATED = data.meta.generated

export const YEARS: number[] = Array.from(new Set(data.months.map((m) => m[0] as number))).sort((a, b) => a - b)
export const FIRST_YEAR = YEARS[0]
export const LAST_YEAR = YEARS[YEARS.length - 1]
/** Years with all 12 months */
export const FULL_YEARS = YEARS.filter((y) => data.months.filter((m) => m[0] === y && m[2] !== null).length === 12)

function column(name: string) {
  return name === 'World' ? 2 : 3 + HISTORY_REGIONS.indexOf(name)
}

/** value[year][month 0-11] for the world or a region */
export function monthly(name = 'World'): Record<number, (number | null)[]> {
  const c = column(name)
  const out: Record<number, (number | null)[]> = {}
  for (const y of YEARS) out[y] = Array(12).fill(null)
  for (const m of data.months) out[m[0] as number][(m[1] as number) - 1] = m[c] as number | null
  return out
}

/** Average daily fire index of each year. Partial years use only the months available. */
export function annual(name = 'World'): { year: number; value: number | null; partial: boolean }[] {
  const mm = monthly(name)
  return YEARS.map((y) => {
    const v = mm[y].filter((x): x is number => x !== null)
    return { year: y, value: v.length ? v.reduce((a, b) => a + b, 0) / v.length : null, partial: !FULL_YEARS.includes(y) }
  })
}

/** Average of each calendar month over all full years: which months burn most? */
export function seasonality(name = 'World'): number[] {
  const mm = monthly(name)
  return Array.from({ length: 12 }, (_, i) => {
    const v = FULL_YEARS.map((y) => mm[y][i]).filter((x): x is number => x !== null)
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0
  })
}

/** Grid cells: average daily fire index per 10° square for one year, or averaged over all full years. */
export function gridFor(year: number | 'all'): number[] {
  if (year !== 'all') return data.grid[String(year)] || []
  const ys = FULL_YEARS.map((y) => data.grid[String(y)]).filter(Boolean)
  return ys[0].map((_, i) => ys.reduce((a, g) => a + g[i], 0) / ys.length)
}

export function cellBounds(i: number) {
  const row = Math.floor(i / 36)
  const col = i % 36
  const north = 90 - row * 10
  const west = -180 + col * 10
  return { north, south: north - 10, west, east: west + 10, lat: north - 5, lng: west + 5 }
}

/** Rough names for the 10° squares that matter most (fire hotspots). */
export function cellName(i: number): string {
  const { lat, lng } = cellBounds(i)
  const ns = lat >= 0 ? `${lat}°N` : `${-lat}°S`
  const ew = lng >= 0 ? `${lng}°E` : `${-lng}°W`
  return `${placeName(lat, lng)} (${ns}, ${ew})`
}

function placeName(lat: number, lng: number): string {
  const P: [number, number, number, number, string][] = [
    // [south, north, west, east, name]
    [0, 20, -20, 40, 'West & Central Africa (Sahel / savanna)'],
    [-20, 0, 10, 40, 'Southern Central Africa (Angola, DRC, Zambia)'],
    [-30, -20, 10, 40, 'Southern Africa'],
    [-30, 0, 40, 51, 'Madagascar & East Africa'],
    [0, 20, 40, 60, 'Horn of Africa & Arabia'],
    [-20, 0, -80, -30, 'Amazon & Cerrado, Brazil'],
    [-40, -20, -80, -40, 'Southern South America'],
    [0, 20, -100, -50, 'Central America & northern South America'],
    [20, 40, 60, 90, 'India & Pakistan'],
    [10, 30, 90, 110, 'South-East Asia (Myanmar, Thailand, Laos, Cambodia)'],
    [-10, 10, 90, 130, 'Indonesia & Malaysia'],
    [-40, -10, 110, 160, 'Australia'],
    [40, 80, 30, 180, 'Russia (Siberia)'],
    [40, 80, -170, -50, 'Canada & Alaska'],
    [20, 50, -130, -60, 'United States & Mexico'],
    [20, 50, 100, 150, 'China, Korea & Japan'],
    [30, 70, -10, 30, 'Europe'],
    [20, 40, 30, 60, 'Middle East'],
    [30, 50, 50, 100, 'Central Asia & Kazakhstan'],
  ]
  for (const [s, n, w, e, name] of P) if (lat >= s && lat < n && lng >= w && lng < e) return name
  return 'Elsewhere'
}

export function topCells(year: number | 'all', n = 8) {
  const g = gridFor(year)
  return g
    .map((v, i) => ({ i, v }))
    .sort((a, b) => b.v - a.v)
    .slice(0, n)
    .map((c) => ({ ...c, name: cellName(c.i) }))
}
