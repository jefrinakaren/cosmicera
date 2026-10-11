// NOAA Space Weather Prediction Center: free public data, no API key.
// https://www.swpc.noaa.gov/

const BASE = 'https://services.swpc.noaa.gov'

export type KpPoint = { time: string; kp: number }

export type SolarWind = { speed: number | null; bt: number | null; bz: number | null; time: string | null }

export type StormScale = { level: number; text: string }

/** Kp index every 3 hours for roughly the last 7 days. */
export async function fetchKpHistory(): Promise<KpPoint[]> {
  const res = await fetch(`${BASE}/products/noaa-planetary-k-index.json`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Kp request failed')
  const rows: Array<{ time_tag: string; Kp: number | string }> = await res.json()
  return rows
    .map((r) => ({ time: r.time_tag, kp: Number(r.Kp) }))
    .filter((r) => Number.isFinite(r.kp))
}

/** Latest solar wind speed (km/s) and interplanetary magnetic field (nT). */
export async function fetchSolarWind(): Promise<SolarWind> {
  const [speedRes, magRes] = await Promise.all([
    fetch(`${BASE}/products/summary/solar-wind-speed.json`, { cache: 'no-store' }),
    fetch(`${BASE}/products/summary/solar-wind-mag-field.json`, { cache: 'no-store' }),
  ])
  const speedRows = speedRes.ok ? await speedRes.json() : []
  const magRows = magRes.ok ? await magRes.json() : []
  const s = speedRows?.[0]
  const m = magRows?.[0]
  return {
    speed: s ? Number(s.proton_speed) : null,
    bt: m ? Number(m.bt) : null,
    bz: m ? Number(m.bz_gsm) : null,
    time: m?.time_tag ?? s?.time_tag ?? null,
  }
}

/** NOAA's "G" geomagnetic storm scale right now: 0 (none) to 5 (extreme). */
export async function fetchStormScale(): Promise<StormScale | null> {
  const res = await fetch(`${BASE}/products/noaa-scales.json`, { cache: 'no-store' })
  if (!res.ok) return null
  const json = await res.json()
  const g = json?.['0']?.G
  if (!g) return null
  return { level: Number(g.Scale), text: String(g.Text) }
}

/** Image links. The `t` value changes every 10 minutes so the browser always fetches the newest picture. */
export function liveImages(tick: number) {
  const t = tick
  return {
    auroraNorth: `${BASE}/images/aurora-forecast-northern-hemisphere.jpg?t=${t}`,
    auroraSouth: `${BASE}/images/aurora-forecast-southern-hemisphere.jpg?t=${t}`,
    sunCorona: `https://sdo.gsfc.nasa.gov/assets/img/latest/latest_512_0193.jpg?t=${t}`,
    sunSpots: `https://sdo.gsfc.nasa.gov/assets/img/latest/latest_512_HMIIC.jpg?t=${t}`,
  }
}
