// Burned-area statistics for every country, 2012 to now.
// Source: Global Wildfire Information System (GWIS, European Commission JRC),
// published by Our World in Data: https://ourworldindata.org/wildfires
// The data is downloaded live, so it updates on its own (GWIS updates weekly).

const ANNUAL_URL =
  'https://ourworldindata.org/grapher/annual-area-burnt-by-wildfires.csv?v=1&csvType=full&useColumnShortNames=true'
const WEEKLY_URL =
  'https://ourworldindata.org/grapher/cumulative-area-burnt-by-wildfires-by-week.csv?v=1&csvType=full&useColumnShortNames=true'

/** country -> year -> hectares burned */
export type AnnualData = Record<string, Record<number, number>>
/** country -> year -> cumulative hectares at the end of each week (index 0 = week 1) */
export type WeeklyData = Record<string, Record<number, (number | null)[]>>

/** Split one CSV line, respecting "quoted, values". */
function splitCsv(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let q = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') q = !q
    else if (ch === ',' && !q) {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out
}

let annualPromise: Promise<AnnualData> | null = null
let weeklyPromise: Promise<WeeklyData> | null = null

export function fetchAnnualBurned(): Promise<AnnualData> {
  if (!annualPromise) {
    annualPromise = fetch(ANNUAL_URL)
      .then((r) => {
        if (!r.ok) throw new Error('GWIS annual data failed')
        return r.text()
      })
      .then((text) => {
        const data: AnnualData = {}
        const lines = text.trim().split('\n')
        for (const line of lines.slice(1)) {
          const [entity, , year, ha] = splitCsv(line)
          if (!entity || !year) continue
          ;(data[entity] ||= {})[Number(year)] = Number(ha)
        }
        return data
      })
      .catch((e) => {
        annualPromise = null
        throw e
      })
  }
  return annualPromise
}

export function fetchWeeklyBurned(): Promise<WeeklyData> {
  if (!weeklyPromise) {
    weeklyPromise = fetch(WEEKLY_URL)
      .then((r) => {
        if (!r.ok) throw new Error('GWIS weekly data failed')
        return r.text()
      })
      .then((text) => {
        const lines = text.trim().split('\n')
        const header = splitCsv(lines[0])
        // columns look like _2024_area_ha_cumulative
        const yearCols = header
          .map((h, i) => ({ i, y: Number((h.match(/^_(\d{4})_/) || [])[1]) }))
          .filter((c) => c.y > 0)
        const data: WeeklyData = {}
        for (const line of lines.slice(1)) {
          const cells = splitCsv(line)
          const entity = cells[0]
          const week = Number(cells[2])
          if (!entity || !week) continue
          const byYear = (data[entity] ||= {})
          for (const c of yearCols) {
            const arr = (byYear[c.y] ||= Array(53).fill(null))
            const v = cells[c.i]
            arr[week - 1] = v === '' || v === undefined ? null : Number(v)
          }
        }
        return data
      })
      .catch((e) => {
        weeklyPromise = null
        throw e
      })
  }
  return weeklyPromise
}

/** Groups and continents in the data that are not single countries. */
export const AGGREGATES = new Set([
  'World',
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'South America',
  'Oceania',
  'European Union (27)',
])

export function formatHa(ha: number): string {
  if (ha >= 1e6) return (ha / 1e6).toFixed(ha >= 1e7 ? 0 : 1) + ' million ha'
  if (ha >= 1e3) return Math.round(ha / 1e3).toLocaleString() + ' thousand ha'
  return Math.round(ha).toLocaleString() + ' ha'
}
