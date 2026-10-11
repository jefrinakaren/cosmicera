// NASA GIBS (Global Imagery Browse Services): free, no API key.
// https://nasa-gibs.github.io/gibs-api-docs/

export const TRUE_COLOR_LAYER = 'VIIRS_SNPP_CorrectedReflectance_TrueColor'
export const FIRE_LAYER = 'VIIRS_NOAA21_Thermal_Anomalies_375m_All'

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
