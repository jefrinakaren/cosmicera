// Live natural-hazard feeds (all free, no API key, all allow browser access):
//  - USGS earthquakes      https://earthquake.usgs.gov/earthquakes/feed/
//  - NASA EONET            https://eonet.gsfc.nasa.gov/   (volcanoes, floods, storms, drought, oil/man-made)
//  - GDACS (UN + EU)       https://www.gdacs.org/         (alerts with Green / Orange / Red levels)
// Plus a hand-made list of famous past events for historical comparison.

import type { EventKind } from './colors'

export type Hazard = {
  id: string
  kind: EventKind
  title: string
  lat: number
  lng: number
  date: string // ISO date
  magnitude?: number
  alert?: 'Green' | 'Orange' | 'Red'
  source: string
  url?: string
  historic?: boolean
  note?: string
}

async function getJson(url: string, timeoutMs = 20000): Promise<any> {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctl.signal })
    if (!res.ok) throw new Error(`${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(t)
  }
}

/** USGS earthquakes of the last `days` days at or above `minMag` (USGS search API). */
export async function fetchQuakesSince(days: number, minMag: number): Promise<Hazard[]> {
  const start = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
  const j = await getJson(
    `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${start}&minmagnitude=${minMag}&orderby=time&limit=2000`
  )
  return quakeFeatures(j)
}

/** USGS earthquakes. period: last day / week / month. */
export async function fetchQuakes(period: 'day' | 'week' | 'month', minMag: '2.5' | '4.5'): Promise<Hazard[]> {
  const j = await getJson(`https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${minMag}_${period}.geojson`)
  return quakeFeatures(j)
}

function quakeFeatures(j: any): Hazard[] {
  return (j.features || []).map((f: any) => ({
    id: 'usgs-' + f.id,
    kind: 'earthquake' as const,
    title: f.properties.title,
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
    date: new Date(f.properties.time).toISOString(),
    magnitude: f.properties.mag,
    alert: f.properties.alert ? (cap(f.properties.alert) as any) : undefined,
    source: 'USGS',
    url: f.properties.url,
    note: f.properties.tsunami ? 'Tsunami message issued' : undefined,
  }))
}

const EONET_KIND: Record<string, EventKind> = {
  volcanoes: 'volcano',
  floods: 'flood',
  severeStorms: 'storm',
  drought: 'drought',
  manmade: 'oil',
  tempExtremes: 'heat',
}

/** NASA EONET natural events of the last `days` days (open and closed). */
export async function fetchEonet(days: number): Promise<Hazard[]> {
  const j = await getJson(
    `https://eonet.gsfc.nasa.gov/api/v3/events?status=all&days=${days}&category=${Object.keys(EONET_KIND).join(',')}&limit=1000`
  )
  const out: Hazard[] = []
  for (const e of j.events || []) {
    const kind = EONET_KIND[e.categories?.[0]?.id]
    const g = e.geometry?.[e.geometry.length - 1]
    if (!kind || !g) continue
    // Points have [lng, lat]; polygons have rings - use the first corner
    const c = g.type === 'Point' ? g.coordinates : g.coordinates?.[0]?.[0]
    if (!c) continue
    out.push({
      id: 'eonet-' + e.id,
      kind,
      title: e.title,
      lat: c[1],
      lng: c[0],
      date: g.date,
      magnitude: g.magnitudeValue ?? undefined,
      source: 'NASA EONET',
      url: e.sources?.[0]?.url || e.link,
      note: e.closed ? 'Event has ended' : 'Still active',
    })
  }
  return out
}

const GDACS_KIND: Record<string, EventKind> = { EQ: 'earthquake', TC: 'storm', FL: 'flood', VO: 'volcano', DR: 'drought', WF: 'wildfire' }

/** GDACS disaster alerts of the last `days` days. */
export async function fetchGdacs(days: number): Promise<Hazard[]> {
  const to = new Date()
  const from = new Date(Date.now() - days * 86400000)
  const d = (x: Date) => x.toISOString().slice(0, 10)
  const j = await getJson(
    `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ;TC;FL;VO;DR;WF&alertlevel=Green;Orange;Red&fromDate=${d(from)}&toDate=${d(to)}`,
    25000
  )
  return (j.features || [])
    .filter((f: any) => f.geometry?.type === 'Point')
    .map((f: any) => {
      const p = f.properties
      return {
        id: `gdacs-${p.eventtype}-${p.eventid}-${p.episodeid}`,
        kind: GDACS_KIND[p.eventtype] || 'storm',
        title: p.name || p.eventname,
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        date: p.fromdate,
        alert: p.alertlevel,
        source: 'GDACS',
        url: p.url?.report,
        note: p.country ? `Country: ${p.country}` : undefined,
      } as Hazard
    })
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Distance in km between two points (haversine). */
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371
  const toRad = (x: number) => (x * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * Famous past events, used for "historical comparison" on the maps.
 * Locations are approximate (the centre of the affected area).
 */
export const HISTORIC: Hazard[] = [
  // Earthquakes (magnitude from USGS)
  { id: 'h-q-1960', kind: 'earthquake', title: 'Valdivia, Chile – the strongest earthquake ever recorded', lat: -38.2, lng: -73.1, date: '1960-05-22', magnitude: 9.5, source: 'USGS', historic: true },
  { id: 'h-q-1964', kind: 'earthquake', title: 'Great Alaska earthquake', lat: 61.0, lng: -147.7, date: '1964-03-27', magnitude: 9.2, source: 'USGS', historic: true },
  { id: 'h-q-2004', kind: 'earthquake', title: 'Sumatra–Andaman earthquake and Indian Ocean tsunami', lat: 3.3, lng: 96.0, date: '2004-12-26', magnitude: 9.1, source: 'USGS', historic: true },
  { id: 'h-q-2011', kind: 'earthquake', title: 'Tōhoku, Japan earthquake and tsunami', lat: 38.3, lng: 142.4, date: '2011-03-11', magnitude: 9.1, source: 'USGS', historic: true },
  { id: 'h-q-2010', kind: 'earthquake', title: 'Haiti earthquake', lat: 18.5, lng: -72.5, date: '2010-01-12', magnitude: 7.0, source: 'USGS', historic: true },
  { id: 'h-q-2015', kind: 'earthquake', title: 'Gorkha, Nepal earthquake', lat: 28.2, lng: 84.7, date: '2015-04-25', magnitude: 7.8, source: 'USGS', historic: true },
  { id: 'h-q-2023', kind: 'earthquake', title: 'Türkiye–Syria earthquake', lat: 37.2, lng: 37.0, date: '2023-02-06', magnitude: 7.8, source: 'USGS', historic: true },
  { id: 'h-q-2025', kind: 'earthquake', title: 'Myanmar (Sagaing) earthquake', lat: 22.0, lng: 95.9, date: '2025-03-28', magnitude: 7.7, source: 'USGS', historic: true },
  // Volcanic eruptions
  { id: 'h-v-79', kind: 'volcano', title: 'Vesuvius buries Pompeii', lat: 40.8, lng: 14.4, date: '0079-08-24', source: 'Smithsonian GVP', historic: true },
  { id: 'h-v-1815', kind: 'volcano', title: 'Tambora, Indonesia – "year without a summer" followed', lat: -8.25, lng: 118.0, date: '1815-04-10', source: 'Smithsonian GVP', historic: true },
  { id: 'h-v-1883', kind: 'volcano', title: 'Krakatoa, Indonesia', lat: -6.1, lng: 105.4, date: '1883-08-27', source: 'Smithsonian GVP', historic: true },
  { id: 'h-v-1980', kind: 'volcano', title: 'Mount St. Helens, USA', lat: 46.2, lng: -122.2, date: '1980-05-18', source: 'USGS', historic: true },
  { id: 'h-v-1991', kind: 'volcano', title: 'Pinatubo, Philippines – cooled the whole planet for a year', lat: 15.1, lng: 120.35, date: '1991-06-15', source: 'USGS', historic: true },
  { id: 'h-v-2010', kind: 'volcano', title: 'Eyjafjallajökull, Iceland – ash closed European airspace', lat: 63.6, lng: -19.6, date: '2010-04-14', source: 'Smithsonian GVP', historic: true },
  { id: 'h-v-2018', kind: 'volcano', title: 'Kīlauea, Hawaiʻi lower East Rift eruption', lat: 19.4, lng: -154.9, date: '2018-05-03', source: 'USGS', historic: true },
  { id: 'h-v-2022', kind: 'volcano', title: 'Hunga Tonga–Hunga Haʻapai, Tonga – biggest blast in modern times', lat: -20.55, lng: -175.4, date: '2022-01-15', source: 'Smithsonian GVP', historic: true },
  // Floods
  { id: 'h-f-1931', kind: 'flood', title: 'China (Yangtze and Huai rivers) floods', lat: 30.6, lng: 114.3, date: '1931-07-01', source: 'Historical records', historic: true },
  { id: 'h-f-2005', kind: 'flood', title: 'Hurricane Katrina floods New Orleans', lat: 29.95, lng: -90.07, date: '2005-08-29', source: 'NOAA', historic: true },
  { id: 'h-f-2010', kind: 'flood', title: 'Pakistan Indus floods', lat: 30.0, lng: 71.5, date: '2010-07-29', source: 'Historical records', historic: true },
  { id: 'h-f-2011', kind: 'flood', title: 'Thailand floods', lat: 14.0, lng: 100.5, date: '2011-07-25', source: 'Historical records', historic: true },
  { id: 'h-f-2021', kind: 'flood', title: 'Germany & Belgium flash floods', lat: 50.5, lng: 7.1, date: '2021-07-14', source: 'Historical records', historic: true },
  { id: 'h-f-2022', kind: 'flood', title: 'Pakistan floods – one third of the country under water', lat: 26.0, lng: 68.5, date: '2022-06-14', source: 'Historical records', historic: true },
  { id: 'h-f-2023', kind: 'flood', title: 'Derna, Libya dam collapse (Storm Daniel)', lat: 32.76, lng: 22.64, date: '2023-09-10', source: 'Historical records', historic: true },
  { id: 'h-f-2024a', kind: 'flood', title: 'UAE record rainfall and floods', lat: 25.2, lng: 55.3, date: '2024-04-16', source: 'UAE NCM', historic: true },
  { id: 'h-f-2024b', kind: 'flood', title: 'Valencia, Spain flash floods (DANA)', lat: 39.4, lng: -0.42, date: '2024-10-29', source: 'Historical records', historic: true },
  // Oil spills
  { id: 'h-o-1978', kind: 'oil', title: 'Amoco Cadiz tanker, France', lat: 48.6, lng: -4.7, date: '1978-03-16', source: 'NOAA / ITOPF', historic: true },
  { id: 'h-o-1979a', kind: 'oil', title: 'Ixtoc I oil well blowout, Gulf of Mexico', lat: 19.4, lng: -92.3, date: '1979-06-03', source: 'NOAA', historic: true },
  { id: 'h-o-1979b', kind: 'oil', title: 'Atlantic Empress tanker collision, off Tobago', lat: 11.6, lng: -60.0, date: '1979-07-19', source: 'ITOPF', historic: true },
  { id: 'h-o-1989', kind: 'oil', title: 'Exxon Valdez tanker, Alaska', lat: 60.8, lng: -146.9, date: '1989-03-24', source: 'NOAA', historic: true },
  { id: 'h-o-1991', kind: 'oil', title: 'Gulf War oil spill, Arabian Gulf – the largest ever', lat: 28.0, lng: 49.3, date: '1991-01-19', source: 'NOAA', historic: true },
  { id: 'h-o-2002', kind: 'oil', title: 'Prestige tanker, Spain', lat: 42.9, lng: -9.9, date: '2002-11-13', source: 'ITOPF', historic: true },
  { id: 'h-o-2007', kind: 'oil', title: 'Hebei Spirit tanker, South Korea', lat: 36.9, lng: 126.0, date: '2007-12-07', source: 'ITOPF', historic: true },
  { id: 'h-o-2010', kind: 'oil', title: 'Deepwater Horizon oil platform, Gulf of Mexico', lat: 28.74, lng: -88.39, date: '2010-04-20', source: 'NOAA', historic: true },
  { id: 'h-o-2018', kind: 'oil', title: 'Sanchi tanker, East China Sea', lat: 30.9, lng: 124.6, date: '2018-01-06', source: 'ITOPF', historic: true },
  { id: 'h-o-2020', kind: 'oil', title: 'MV Wakashio, Mauritius', lat: -20.44, lng: 57.75, date: '2020-07-25', source: 'ITOPF', historic: true },
  { id: 'h-o-2022', kind: 'oil', title: 'Ventanilla refinery spill, Peru', lat: -11.87, lng: -77.13, date: '2022-01-15', source: 'Historical records', historic: true },
  { id: 'h-o-2024', kind: 'oil', title: 'Kerch Strait tanker spill, Black Sea', lat: 45.3, lng: 36.5, date: '2024-12-15', source: 'Historical records', historic: true },
  // Wildfires
  { id: 'h-w-2010', kind: 'wildfire', title: 'Russian heatwave and wildfires', lat: 55.5, lng: 40.0, date: '2010-07-15', source: 'NASA', historic: true },
  { id: 'h-w-2015', kind: 'wildfire', title: 'Indonesian peat fires and haze', lat: -2.5, lng: 113.7, date: '2015-09-01', source: 'NASA', historic: true },
  { id: 'h-w-2018', kind: 'wildfire', title: 'Camp Fire, Paradise, California', lat: 39.76, lng: -121.6, date: '2018-11-08', source: 'NASA', historic: true },
  { id: 'h-w-2019', kind: 'wildfire', title: 'Black Summer bushfires, Australia', lat: -35.5, lng: 149.5, date: '2019-12-31', source: 'NASA', historic: true },
  { id: 'h-w-2023a', kind: 'wildfire', title: "Canada's record wildfire season", lat: 55.0, lng: -115.0, date: '2023-06-07', source: 'NASA', historic: true },
  { id: 'h-w-2023b', kind: 'wildfire', title: 'Lahaina, Maui fire', lat: 20.88, lng: -156.68, date: '2023-08-08', source: 'NASA', historic: true },
  { id: 'h-w-2025', kind: 'wildfire', title: 'Los Angeles fires (Palisades and Eaton)', lat: 34.07, lng: -118.54, date: '2025-01-07', source: 'NASA', historic: true },
]

/**
 * Everything at once for a time window. Each source can fail on its own;
 * the names of the ones that failed are returned so the page can say so.
 */
export async function loadHazards(days: number): Promise<{ items: Hazard[]; failed: string[] }> {
  const minMag = days <= 7 ? 4 : days <= 31 ? 4.5 : 6
  const jobs: [string, Promise<Hazard[]>][] = [
    ['USGS earthquakes', fetchQuakesSince(days, minMag)],
    ['NASA EONET', fetchEonet(Math.max(days, 30))],
    ['GDACS', fetchGdacs(Math.min(days, 60))],
  ]
  const results = await Promise.allSettled(jobs.map((j) => j[1]))
  const items: Hazard[] = []
  const failed: string[] = []
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') items.push(...r.value)
    else failed.push(jobs[i][0])
  })
  // GDACS also lists earthquakes; keep the USGS ones (more detail) unless GDACS raised an Orange/Red alert
  const cutoff = Date.now() - days * 86400000
  const filtered = items.filter(
    (h) => !(h.source === 'GDACS' && h.kind === 'earthquake' && h.alert === 'Green') && new Date(h.date).getTime() >= cutoff - 86400000
  )
  return { items: filtered, failed }
}

export function inBox(h: { lat: number; lng: number }, box: [number, number, number, number]) {
  const [s, w, n, e] = box
  return h.lat >= s && h.lat <= n && h.lng >= w && h.lng <= e
}
