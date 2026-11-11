// NASA GIBS (Global Imagery Browse Services): free, no API key.
// https://nasa-gibs.github.io/gibs-api-docs/

export const TRUE_COLOR_LAYER = 'VIIRS_SNPP_CorrectedReflectance_TrueColor'
export const FIRE_LAYER = 'VIIRS_NOAA21_Thermal_Anomalies_375m_All'
/** MODIS on Terra: the longest consistent fire record (Nov 2000 – today). */
export const MODIS_FIRE_LAYER = 'MODIS_Terra_Thermal_Anomalies_All'
export const VIIRS_SNPP_FIRE_LAYER = 'VIIRS_SNPP_Thermal_Anomalies_375m_All'
export const BLUE_MARBLE_LAYER = 'BlueMarble_ShadedRelief_Bathymetry'
/** First day with MODIS fire data in NASA GIBS. */
export const MODIS_START = '2000-11-01'

// [south, west, north, east]
export type Box = [number, number, number, number]

/** Yesterday (UTC). Today's satellite passes are not all processed yet. */
export function latestDate(): string {
  return new Date(Date.now() - 86400000).toISOString().slice(0, 10)
}

export function shiftDate(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** A 30 x 20 degree window around a point (clamped to the globe). */
export function regionBox(lat: number, lng: number): Box {
  const south = Math.max(-90, lat - 10)
  const north = Math.min(90, lat + 10)
  return [south, lng - 15, north, lng + 15]
}

export function wmsUrl(layers: string, box: Box, width: number, height: number, format: 'image/jpeg' | 'image/png', date: string): string {
  const [s, w, n, e] = box
  const transparent = format === 'image/png' ? 'TRUE' : 'FALSE'
  return (
    'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0' +
    `&LAYERS=${layers}&STYLES=&FORMAT=${format}&TRANSPARENT=${transparent}&CRS=EPSG:4326` +
    `&BBOX=${s},${w},${n},${e}&WIDTH=${width}&HEIGHT=${height}&TIME=${date}`
  )
}

/** Satellite photo of a region (true colour) with the fire detections drawn on top. */
export function regionPhotoUrl(lat: number, lng: number, date: string): string {
  return wmsUrl(`${TRUE_COLOR_LAYER},${FIRE_LAYER}`, regionBox(lat, lng), 720, 480, 'image/jpeg', date)
}

/**
 * Fire activity index: the percentage of a region's satellite view that is marked
 * with fire detections. Computed live from NASA's fire layer, so it changes every day.
 * Returns null if the image cannot be loaded.
 */
export function fireActivity(lat: number, lng: number, date: string): Promise<number | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    const timer = setTimeout(() => resolve(null), 25000)
    img.onload = () => {
      clearTimeout(timer)
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(null)
        ctx.drawImage(img, 0, 0)
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
        let marked = 0
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) marked++
        resolve((marked / (canvas.width * canvas.height)) * 100)
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => {
      clearTimeout(timer)
      resolve(null)
    }
    img.src = wmsUrl(FIRE_LAYER, regionBox(lat, lng), 300, 200, 'image/png', date)
  })
}

/** Count the pixels marked as fire in a WMS image. Returns null if it cannot be loaded. */
export function countFirePixels(url: string, timeoutMs = 45000): Promise<{ marked: number; total: number } | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    const timer = setTimeout(() => {
      img.src = ''
      resolve(null)
    }, timeoutMs)
    img.onload = () => {
      clearTimeout(timer)
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(null)
        ctx.drawImage(img, 0, 0)
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
        let marked = 0
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) marked++
        resolve({ marked, total: canvas.width * canvas.height })
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => {
      clearTimeout(timer)
      resolve(null)
    }
    img.src = url
  })
}

/** Image size that keeps a box's shape (degrees are drawn square in EPSG:4326). */
export function boxImageSize(box: Box, longSide = 400): [number, number] {
  const [s, w, n, e] = box
  const dLat = Math.max(0.1, n - s)
  const dLng = Math.max(0.1, e - w)
  if (dLng >= dLat) return [longSide, Math.max(20, Math.round((longSide * dLat) / dLng))]
  return [Math.max(20, Math.round((longSide * dLng) / dLat)), longSide]
}

/** Fire activity (% of the box marked with fire) for any box, date and fire layer. */
export async function fireActivityBox(box: Box, date: string, layer = FIRE_LAYER): Promise<number | null> {
  const [w, h] = boxImageSize(box, 300)
  const r = await countFirePixels(wmsUrl(layer, box, w, h, 'image/png', date))
  return r ? (r.marked / r.total) * 100 : null
}

/** Satellite photo (true colour + fire dots) of any box. Uses MODIS colours before VIIRS existed. */
export function boxPhotoUrl(box: Box, date: string, longSide = 640): string {
  const [w, h] = boxImageSize(box, longSide)
  const early = date < '2012-01-20'
  const base = early ? 'MODIS_Terra_CorrectedReflectance_TrueColor' : TRUE_COLOR_LAYER
  const fire = early ? MODIS_FIRE_LAYER : FIRE_LAYER
  return wmsUrl(`${base},${fire}`, box, w, h, 'image/jpeg', date)
}

/** Whole-world fire count for a day (used by the Daily Report). */
export async function worldFirePixels(date: string, layer: string): Promise<number | null> {
  const r = await countFirePixels(wmsUrl(layer, [-90, -180, 90, 180], 2048, 1024, 'image/png', date), 60000)
  return r ? r.marked : null
}

/** Run async jobs a few at a time (GIBS is happier with ~6 parallel requests). */
export async function runLimited<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}
