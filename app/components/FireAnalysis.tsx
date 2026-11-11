'use client'
import { useEffect, useMemo, useState } from 'react'
import { BarChart, Heatmap, LineChart, defaultFormat } from './charts'
import { RampLegend } from './ColorLegend'
import { FIRE_RAMP, rampBlend } from '../lib/colors'
import {
  FULL_YEARS,
  HISTORY_REGIONS,
  LAST_YEAR,
  MONTH_NAMES,
  YEARS,
  annual,
  cellBounds,
  gridFor,
  monthly,
  seasonality,
  topCells,
} from '../lib/modisHistory'
import { AGGREGATES, AnnualData, WeeklyData, fetchAnnualBurned, fetchWeeklyBurned, formatHa } from '../lib/owid'
import { BLUE_MARBLE_LAYER, wmsUrl } from '../lib/gibs'

const A_COLOR = '#34d399'
const B_COLOR = '#f472b6'

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="bg-slate-900/40 rounded-lg p-4 border border-cyan-500/20 space-y-3">
      <div>
        <h3 className="text-lg font-bold text-cyan-400">{title}</h3>
        {sub && <p className="text-sm text-gray-400">{sub}</p>}
      </div>
      {children}
    </section>
  )
}

export default function FireAnalysis() {
  // ---------- MODIS history (built into the app) ----------
  const [place, setPlace] = useState('World')
  const yearly = useMemo(() => annual(place), [place])
  const season = useMemo(() => seasonality(place), [place])
  const heat = useMemo(() => monthly(place), [place])
  const heatVals = useMemo(() => Object.values(heat).flat().filter((v): v is number => v !== null), [heat])
  const heatMax = Math.max(...heatVals)
  const heatMin = Math.min(...heatVals)
  const fullYearly = yearly.filter((y) => !y.partial && y.value !== null) as { year: number; value: number }[]
  const busiest = fullYearly.reduce((a, b) => (b.value > a.value ? b : a), fullYearly[0])
  const quietest = fullYearly.reduce((a, b) => (b.value < a.value ? b : a), fullYearly[0])
  const peakMonth = season.indexOf(Math.max(...season))
  const lowMonth = season.indexOf(Math.min(...season))

  const [gridYear, setGridYear] = useState<number | 'all'>('all')
  const grid = useMemo(() => gridFor(gridYear), [gridYear])
  const gridMax = useMemo(() => Math.max(...grid), [grid])
  const tops = useMemo(() => topCells(gridYear, 8), [gridYear])

  const [regA, setRegA] = useState('Brazil')
  const [regB, setRegB] = useState('Australia')
  const regAnnualA = useMemo(() => annual(regA), [regA])
  const regAnnualB = useMemo(() => annual(regB), [regB])
  const regSeasonA = useMemo(() => seasonality(regA), [regA])
  const regSeasonB = useMemo(() => seasonality(regB), [regB])

  // ---------- Country comparison (GWIS burned area, downloaded live) ----------
  const [annualData, setAnnualData] = useState<AnnualData | null>(null)
  const [weekly, setWeekly] = useState<WeeklyData | null>(null)
  const [gwisError, setGwisError] = useState(false)
  const [countryA, setCountryA] = useState('Brazil')
  const [countryB, setCountryB] = useState('Australia')
  const [cumCountry, setCumCountry] = useState<'A' | 'B' | 'World'>('World')

  useEffect(() => {
    fetchAnnualBurned()
      .then(setAnnualData)
      .catch(() => setGwisError(true))
    fetchWeeklyBurned()
      .then(setWeekly)
      .catch(() => setGwisError(true))
  }, [])

  const countries = useMemo(() => (annualData ? Object.keys(annualData).filter((c) => !AGGREGATES.has(c)).sort() : []), [annualData])
  const gwisYears = useMemo(() => {
    if (!annualData?.World) return []
    return Object.keys(annualData.World)
      .map(Number)
      .sort((a, b) => a - b)
  }, [annualData])
  const currentGwisYear = gwisYears[gwisYears.length - 1]

  const compareStats = (c: string) => {
    const d = annualData?.[c]
    if (!d) return null
    const full = gwisYears.filter((y) => y < currentGwisYear && d[y] !== undefined)
    const avg = full.reduce((a, y) => a + d[y], 0) / Math.max(1, full.length)
    const maxY = full.reduce((a, y) => (d[y] > d[a] ? y : a), full[0])
    return { avg, maxY, max: d[maxY], now: d[currentGwisYear] }
  }
  const sA = compareStats(countryA)
  const sB = compareStats(countryB)

  const cumName = cumCountry === 'A' ? countryA : cumCountry === 'B' ? countryB : 'World'
  const cum = weekly?.[cumName]
  const cumYears = cum ? Object.keys(cum).map(Number).sort((a, b) => a - b) : []
  const cumNow = cumYears[cumYears.length - 1]
  const cumLast = cumNow - 1
  const prevYears = cumYears.filter((y) => y < cumNow)
  const band = useMemo(() => {
    if (!cum) return null
    const lo: (number | null)[] = []
    const hi: (number | null)[] = []
    const avg: (number | null)[] = []
    for (let w = 0; w < 52; w++) {
      const v = prevYears.map((y) => cum[y]?.[w]).filter((x): x is number => x !== null && x !== undefined)
      lo.push(v.length ? Math.min(...v) : null)
      hi.push(v.length ? Math.max(...v) : null)
      avg.push(v.length ? v.reduce((a, b) => a + b, 0) / v.length : null)
    }
    return { lo, hi, avg }
  }, [cum, prevYears.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps
  const latestWeek = cum?.[cumNow] ? cum[cumNow].reduce((last, v, i) => (v !== null ? i : last), -1) : -1
  const nowVsAvg =
    band && latestWeek >= 0 && band.avg[latestWeek] ? ((cum![cumNow][latestWeek]! - band.avg[latestWeek]!) / band.avg[latestWeek]!) * 100 : null
  const weekLabels = Array.from({ length: 52 }, (_, i) => {
    const d = new Date(Date.UTC(2021, 0, 1 + i * 7))
    return d.toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' })
  })

  const fmtIdx = (v: number) => defaultFormat(v)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-cyan-400">Fire analysis: 25 years of heat spots</h2>
        <p className="text-sm text-gray-400">
          Graphs made from NASA&apos;s MODIS fire detections ({YEARS[0]}–{LAST_YEAR}) and from the Global Wildfire Information System&apos;s burned-area data for
          every country.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-gray-300">Analyse:</span>
        {['World', ...HISTORY_REGIONS].map((p) => (
          <button key={p} onClick={() => setPlace(p)} className={`px-3 py-1 rounded ${place === p ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-gray-300'}`}>
            {p}
          </button>
        ))}
      </div>

      <Section
        title={`📅 Which year had the most burning? (${place})`}
        sub="Average daily MODIS fire index for each year. The white outline marks the busiest full year. The last year is partial (up to October). Careful: part of the drop in 2025–2026 is because the ageing Terra satellite has drifted and now passes over at a different time of day, so it sees fewer fires."
      >
        <BarChart
          data={yearly.map((y) => ({
            label: String(y.year),
            value: y.value,
            color: y.partial ? '#64748b' : y.year === busiest?.year ? '#f97316' : '#34d399',
            note: y.partial ? 'partial year' : undefined,
          }))}
          format={fmtIdx}
          highlightMax
        />
        {busiest && quietest && (
          <p className="text-sm text-gray-200">
            🔥 Busiest year: <b>{busiest.year}</b>. 💧 Quietest year: <b>{quietest.year}</b>. The busiest year had{' '}
            <b>{Math.round(((busiest.value - quietest.value) / quietest.value) * 100)}%</b> more fire than the quietest.
          </p>
        )}
      </Section>

      <Section title={`🗓️ Which parts of the year see more fires? (${place})`} sub="Each square is one month of one year. Brighter = more fire (dark = the quietest month in the table, white = the busiest).">
        <Heatmap
          rows={YEARS.map((y) => ({ label: String(y), values: heat[y] }))}
          cols={MONTH_NAMES}
          color={(v) => rampBlend(FIRE_RAMP, heatMax > heatMin ? 0.08 + (0.92 * (v - heatMin)) / (heatMax - heatMin) : 0.5)}
          format={fmtIdx}
        />
        <RampLegend title="Fire index" ramp={FIRE_RAMP} smooth />
        <BarChart
          data={season.map((v, i) => ({ label: MONTH_NAMES[i], value: v, color: i === peakMonth ? '#f97316' : '#a78bfa' }))}
          format={fmtIdx}
          height={200}
        />
        <p className="text-sm text-gray-200">
          On average, <b>{MONTH_NAMES[peakMonth]}</b> is the busiest fire month for {place.toLowerCase() === 'world' ? 'the world' : place}, and{' '}
          <b>{MONTH_NAMES[lowMonth]}</b> is the quietest ({FULL_YEARS[0]}–{FULL_YEARS[FULL_YEARS.length - 1]} average).
          {place === 'World' &&
            ' The August–September peak comes mostly from the savannas of southern Africa and the Amazon and Cerrado in South America. North of the equator, Africa burns most from December to February.'}
        </p>
      </Section>

      <Section title="🌍 Which places see the most fires?" sub="The world cut into 10° squares, coloured by MODIS fire activity.">
        <div className="flex flex-wrap gap-2 items-center text-sm">
          <span className="text-gray-300">Year:</span>
          <select
            value={String(gridYear)}
            onChange={(e) => setGridYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="bg-slate-700 rounded px-2 py-1"
          >
            <option value="all">Average of all full years</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
                {FULL_YEARS.includes(y) ? '' : ' (partial)'}
              </option>
            ))}
          </select>
        </div>
        <div className="relative w-full" style={{ aspectRatio: '2 / 1' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={wmsUrl(BLUE_MARBLE_LAYER, [-90, -180, 90, 180], 1024, 512, 'image/jpeg', '2004-08-01')}
            alt="World map"
            className="absolute inset-0 w-full h-full rounded opacity-70"
          />
          <svg viewBox="0 0 360 180" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            {grid.map((v, i) => {
              if (!gridMax || v <= 0) return null
              const b = cellBounds(i)
              const t = Math.sqrt(v / gridMax)
              return (
                <rect key={i} x={b.west + 180} y={90 - b.north} width={10} height={10} fill={rampBlend(FIRE_RAMP, t)} opacity={0.25 + t * 0.7}>
                  <title>{`${b.south}° to ${b.north}°, ${b.west}° to ${b.east}°: fire index ${v.toFixed(1)}`}</title>
                </rect>
              )
            })}
          </svg>
        </div>
        <RampLegend title="Fire activity (square-root scale, so small fires still show)" ramp={FIRE_RAMP} smooth />
        <ol className="text-sm text-gray-200 list-decimal pl-6 space-y-0.5">
          {tops.map((c) => (
            <li key={c.i}>
              {c.name} – fire index {c.v.toFixed(1)}
            </li>
          ))}
        </ol>
      </Section>

      <Section title="⚖️ Compare two hotspot regions" sub="MODIS fire index inside the 8 hotspot regions of the Hotspot Map (each region is a 30° × 20° box).">
        <div className="flex flex-wrap gap-3 text-sm">
          {[
            { v: regA, set: setRegA, c: A_COLOR },
            { v: regB, set: setRegB, c: B_COLOR },
          ].map((s, k) => (
            <select key={k} value={s.v} onChange={(e) => s.set(e.target.value)} className="bg-slate-700 rounded px-2 py-1 border-l-4" style={{ borderColor: s.c }}>
              {HISTORY_REGIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          ))}
        </div>
        <p className="text-sm text-gray-300 font-semibold">Year by year</p>
        <BarChart
          labels={YEARS.map(String)}
          series={[
            { name: regA, color: A_COLOR, values: regAnnualA.map((y) => y.value) },
            { name: regB, color: B_COLOR, values: regAnnualB.map((y) => y.value) },
          ]}
          format={fmtIdx}
        />
        <p className="text-sm text-gray-300 font-semibold">Fire season (average month)</p>
        <LineChart
          labels={MONTH_NAMES}
          series={[
            { name: regA, color: A_COLOR, values: regSeasonA },
            { name: regB, color: B_COLOR, values: regSeasonB },
          ]}
          format={fmtIdx}
          height={220}
        />
      </Section>

      <Section
        title="🏳️ Compare burning between two countries"
        sub="Area burned each year (hectares; 1 hectare = 100 m × 100 m) for any two countries, from the Global Wildfire Information System. Downloaded live."
      >
        {gwisError && <p className="text-sm text-amber-300">⚠️ Could not download the country data right now. Please try again later.</p>}
        {!annualData && !gwisError && <p className="text-sm text-gray-400">Loading country data…</p>}
        {annualData && (
          <>
            <div className="flex flex-wrap gap-3 text-sm">
              {[
                { v: countryA, set: setCountryA, c: A_COLOR },
                { v: countryB, set: setCountryB, c: B_COLOR },
              ].map((s, k) => (
                <select key={k} value={s.v} onChange={(e) => s.set(e.target.value)} className="bg-slate-700 rounded px-2 py-1 border-l-4 max-w-[14rem]" style={{ borderColor: s.c }}>
                  {countries.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              ))}
            </div>
            <BarChart
              labels={gwisYears.map(String)}
              series={[
                { name: countryA, color: A_COLOR, values: gwisYears.map((y) => annualData[countryA]?.[y] ?? null) },
                { name: countryB, color: B_COLOR, values: gwisYears.map((y) => annualData[countryB]?.[y] ?? null) },
              ]}
              format={(v) => defaultFormat(v) + ' ha'}
            />
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                { name: countryA, s: sA, c: A_COLOR },
                { name: countryB, s: sB, c: B_COLOR },
              ].map((x) =>
                x.s ? (
                  <div key={x.name} className="bg-slate-800 rounded p-3 border-l-4" style={{ borderColor: x.c }}>
                    <p className="font-bold" style={{ color: x.c }}>
                      {x.name}
                    </p>
                    <p>Average per year: {formatHa(x.s.avg)}</p>
                    <p>
                      Worst year: <b>{x.s.maxY}</b> ({formatHa(x.s.max)})
                    </p>
                    <p>
                      {currentGwisYear} so far: {x.s.now !== undefined ? formatHa(x.s.now) : 'no data'}
                    </p>
                  </div>
                ) : null
              )}
            </div>
            {sA && sB && sA.avg > 0 && sB.avg > 0 && (
              <p className="text-sm text-gray-200">
                On average, <b>{sA.avg >= sB.avg ? countryA : countryB}</b> burns{' '}
                <b>{(Math.max(sA.avg, sB.avg) / Math.min(sA.avg, sB.avg)).toFixed(1)} times</b> more land each year than{' '}
                {sA.avg >= sB.avg ? countryB : countryA}. (Bigger countries usually burn more, so also think about their size!)
              </p>
            )}
          </>
        )}
      </Section>

      <Section
        title="📈 Is this year worse than before? Current fires vs previous years"
        sub="Total area burned since 1 January, week by week. The shaded band shows the lowest and highest of all previous years."
      >
        {weekly && (
          <>
            <div className="flex flex-wrap gap-2 text-sm">
              {(['World', 'A', 'B'] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setCumCountry(k)}
                  className={`px-3 py-1 rounded ${cumCountry === k ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-gray-300'}`}
                >
                  {k === 'World' ? 'World' : k === 'A' ? countryA : countryB}
                </button>
              ))}
            </div>
            {cum && band ? (
              <>
                <LineChart
                  labels={weekLabels}
                  series={[
                    { name: `${cumNow} (this year)`, color: '#f97316', values: cum[cumNow] || [], width: 3 },
                    { name: `${cumLast}`, color: '#a78bfa', values: cum[cumLast] || [], dashed: true },
                    { name: `Average ${prevYears[0]}–${cumLast}`, color: '#e5e7eb', values: band.avg, width: 1.5 },
                  ]}
                  band={{ lo: band.lo, hi: band.hi, color: '#34d399', name: 'Lowest–highest previous year' }}
                  format={(v) => defaultFormat(v) + ' ha'}
                />
                {nowVsAvg !== null && (
                  <p className="text-sm text-gray-200">
                    Up to week {latestWeek + 1} of {cumNow}, {cumName === 'World' ? 'the world' : cumName} has burned{' '}
                    <b>{formatHa(cum[cumNow][latestWeek] as number)}</b>, which is{' '}
                    <b className={nowVsAvg > 0 ? 'text-orange-300' : 'text-emerald-300'}>
                      {Math.abs(Math.round(nowVsAvg))}% {nowVsAvg > 0 ? 'more' : 'less'}
                    </b>{' '}
                    than the average of previous years at the same point.
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400">No weekly data for {cumName}.</p>
            )}
          </>
        )}
        <p className="text-xs text-gray-500">
          Data: GWIS (European Commission JRC) via Our World in Data. Figures for the most recent years come from near-real-time satellite processing and may
          be revised upwards later, so very recent years can look lower than they really were.
        </p>
      </Section>

      <p className="text-xs text-gray-500">
        How the MODIS history was measured: on the 8th and 22nd of every month since January 2001, this project downloaded NASA&apos;s world map of MODIS Terra
        fire detections and counted the pixels marked as fire (one pixel ≈ 20 km × 20 km). The &quot;fire index&quot; is the average number of fire pixels per sample
        day. Clouds, smoke and the satellite&apos;s slow orbit drift after 2020 add some noise.
      </p>
    </div>
  )
}
