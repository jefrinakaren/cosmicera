'use client'
import { useEffect, useMemo, useState } from 'react'
import { REGIONS } from '../lib/regions'
import { FIRE_LAYER, MODIS_FIRE_LAYER, fireActivity, latestDate, shiftDate, worldFirePixels, wmsUrl, BLUE_MARBLE_LAYER } from '../lib/gibs'
import { Hazard, fetchEonet, fetchGdacs, fetchQuakes } from '../lib/hazards'
import { KpPoint, StormScale, fetchKpHistory, fetchStormScale } from '../lib/noaa'
import { MONTH_NAMES, annual, monthly, seasonality, topCells, FULL_YEARS } from '../lib/modisHistory'
import { WeeklyData, fetchWeeklyBurned, formatHa } from '../lib/owid'
import { ALERT_COLORS, EVENT_STYLE, KP_RAMP, rampColor } from '../lib/colors'
import { BarChart } from './charts'

type Loadable<T> = T | undefined | null // undefined = loading, null = failed

const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function pct(a: number, b: number) {
  return Math.round(((a - b) / b) * 100)
}

function Card({ title, children, accent = '#34d399' }: { title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div className="bg-slate-800/70 rounded-lg p-4 border-l-4" style={{ borderColor: accent }}>
      <p className="text-sm text-gray-400 mb-1">{title}</p>
      {children}
    </div>
  )
}

export default function DailyReport() {
  const day = latestDate()
  const dayObj = new Date(day + 'T00:00:00Z')
  const monthIdx = dayObj.getUTCMonth()
  const year = dayObj.getUTCFullYear()

  const [viirs, setViirs] = useState<Loadable<{ now: number | null; weekAgo: number | null; lastYear: number | null }>>(undefined)
  const [modisNow, setModisNow] = useState<Loadable<number>>(undefined)
  const [regions, setRegions] = useState<Loadable<{ country: string; value: number | null }[]>>(undefined)
  const [kp, setKp] = useState<Loadable<{ last: KpPoint; max24: number; scale: StormScale | null }>>(undefined)
  const [quakes, setQuakes] = useState<Loadable<Hazard[]>>(undefined)
  const [alerts, setAlerts] = useState<Loadable<Hazard[]>>(undefined)
  const [events, setEvents] = useState<Loadable<Hazard[]>>(undefined)
  const [weekly, setWeekly] = useState<Loadable<WeeklyData>>(undefined)

  useEffect(() => {
    Promise.all([
      worldFirePixels(day, FIRE_LAYER),
      worldFirePixels(shiftDate(day, -7), FIRE_LAYER),
      worldFirePixels(shiftDate(day, -365), FIRE_LAYER),
    ]).then(([now, weekAgo, lastYear]) => setViirs(now === null ? null : { now, weekAgo, lastYear }))
    worldFirePixels(day, MODIS_FIRE_LAYER).then((v) => setModisNow(v))
    Promise.all(REGIONS.map((r) => fireActivity(r.lat, r.lng, day))).then((vals) =>
      setRegions(REGIONS.map((r, i) => ({ country: r.country, value: vals[i] })).sort((a, b) => (b.value ?? -1) - (a.value ?? -1)))
    )
    Promise.all([fetchKpHistory(), fetchStormScale()])
      .then(([hist, scale]) => {
        const last = hist[hist.length - 1]
        const max24 = Math.max(...hist.slice(-8).map((p) => p.kp))
        setKp({ last, max24, scale })
      })
      .catch(() => setKp(null))
    fetchQuakes('day', '2.5')
      .then(setQuakes)
      .catch(() => setQuakes(null))
    fetchGdacs(3)
      .then(setAlerts)
      .catch(() => setAlerts(null))
    fetchEonet(7)
      .then((e) => setEvents(e.filter((x) => x.note === 'Still active')))
      .catch(() => setEvents(null))
    fetchWeeklyBurned()
      .then(setWeekly)
      .catch(() => setWeekly(null))
  }, [day])

  // Long-term context from the MODIS history built into the app
  const season = useMemo(() => seasonality('World'), [])
  const thisMonthAvg = season[monthIdx]
  const monthRank = [...season].sort((a, b) => b - a).indexOf(thisMonthAvg) + 1
  const busiestMonth = season.indexOf(Math.max(...season))
  const years = useMemo(() => annual('World').filter((y) => !y.partial && y.value !== null) as { year: number; value: number }[], [])
  const busiestYear = years.reduce((a, b) => (b.value > a.value ? b : a), years[0])
  const recentYears = years.slice(-5)
  const places = useMemo(() => topCells('all', 3), [])
  const monthHistory = useMemo(() => {
    const m = monthly('World')
    return FULL_YEARS.map((y) => ({ year: y, value: m[y][monthIdx] }))
  }, [monthIdx])

  // Burned area so far this year vs average (GWIS)
  const burned = useMemo(() => {
    const w = weekly?.World
    if (!w) return null
    const ys = Object.keys(w).map(Number).sort((a, b) => a - b)
    const cur = ys[ys.length - 1]
    const arr = w[cur]
    const wk = arr.reduce((last, v, i) => (v !== null ? i : last), -1)
    if (wk < 0) return null
    const prev = ys.filter((y) => y < cur).map((y) => w[y][wk]).filter((v): v is number => v !== null)
    const avg = prev.reduce((a, b) => a + b, 0) / prev.length
    return { cur, wk: wk + 1, value: arr[wk] as number, avg }
  }, [weekly])

  const kpColor = kp ? rampColor(KP_RAMP, kp.last.kp) : '#64748b'
  const biggestQuake = quakes ? quakes.reduce<Hazard | null>((a, b) => (!a || (b.magnitude ?? 0) > (a.magnitude ?? 0) ? b : a), null) : null
  const redOrange = alerts ? alerts.filter((a) => a.alert === 'Red' || a.alert === 'Orange') : []

  // A written summary, built from whatever has loaded
  const summary = useMemo(() => {
    const s: string[] = []
    if (viirs && viirs.now !== null && viirs.weekAgo) {
      const d = pct(viirs.now, viirs.weekAgo)
      s.push(
        Math.abs(d) < 5
          ? "NASA's VIIRS satellite saw about as much fire on Earth as a week earlier."
          : `NASA's VIIRS satellite saw ${d > 0 ? `${d}% more` : `${-d}% less`} fire on Earth than a week earlier.`
      )
    }
    if (typeof modisNow === 'number' && thisMonthAvg) {
      const d = pct(modisNow, thisMonthAvg)
      s.push(
        `Compared with a normal ${FULL_MONTHS[monthIdx]} since 2001 (MODIS), fire activity was ${Math.abs(d) < 10 ? 'close to normal' : d > 0 ? `${d}% above normal` : `${-d}% below normal`}.`
      )
    }
    if (regions && regions[0]?.value !== null && regions[0]) s.push(`Of our 8 hotspot regions, ${regions[0].country} had the most fire.`)
    if (quakes) s.push(`${quakes.length} earthquakes of magnitude 2.5 or more were recorded in the last 24 hours${biggestQuake ? `, the largest was M${biggestQuake.magnitude?.toFixed(1)} (${biggestQuake.title.replace(/^M [\d.]+ - /, '')})` : ''}.`)
    if (alerts) s.push(redOrange.length ? `GDACS raised ${redOrange.length} orange or red disaster alert${redOrange.length > 1 ? 's' : ''} in the last 3 days.` : 'GDACS raised no orange or red disaster alerts in the last 3 days.')
    if (kp) s.push(`Earth's magnetic field is ${kp.last.kp >= 5 ? 'in a geomagnetic STORM' : kp.last.kp >= 4 ? 'active' : 'quiet'} (Kp ${kp.last.kp.toFixed(1)}).`)
    if (burned) {
      const d = pct(burned.value, burned.avg)
      s.push(
        `So far in ${burned.cur}, fires have burned ${formatHa(burned.value)} worldwide, ${Math.abs(d)}% ${d >= 0 ? 'more' : 'less'} than the average up to the same week (recent figures are early estimates and usually go up later).`
      )
    }
    return s
  }, [viirs, modisNow, thisMonthAvg, monthIdx, regions, quakes, biggestQuake, alerts, redOrange.length, kp, burned])

  const loadingText = <span className="text-gray-500">loading…</span>
  const failText = <span className="text-amber-300 text-sm">could not load</span>

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <p className="text-sm text-cyan-300 flex items-center gap-2">
            <span className="live-dot" /> Rebuilt from live data every time you open it
          </p>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text">📰 Daily Earth Report</h1>
          <p className="text-gray-300 mt-1">
            {dayObj.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })} (the latest full day of
            satellite data)
          </p>
        </header>

        <section className="bg-slate-800/50 rounded-lg p-5 border border-cyan-500/30">
          <h2 className="text-xl font-bold text-cyan-400 mb-2">Today in one paragraph</h2>
          {summary.length ? <p className="text-gray-100 leading-relaxed">{summary.join(' ')}</p> : <p className="text-gray-400">Collecting today&apos;s data…</p>}
        </section>

        {/* Fires */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-cyan-400">🔥 Fires</h2>
          <div className="grid md:grid-cols-[1.4fr_1fr] gap-4">
            <figure className="bg-slate-900 rounded overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={wmsUrl(`${BLUE_MARBLE_LAYER},${FIRE_LAYER}`, [-60, -180, 80, 180], 1024, 398, 'image/jpeg', day)}
                alt={`World map of fires detected on ${day}`}
                className="w-full"
              />
              <figcaption className="text-xs p-2 text-gray-400">Every red dot is a fire seen by VIIRS (NOAA-21) on {day}.</figcaption>
            </figure>
            <div className="grid gap-3">
              <Card title="Fire pixels on Earth (VIIRS)" accent="#ef4444">
                {viirs === undefined ? (
                  loadingText
                ) : viirs === null || viirs.now === null ? (
                  failText
                ) : (
                  <>
                    <p className="text-3xl font-bold text-red-400">{viirs.now.toLocaleString()}</p>
                    {viirs.weekAgo !== null && <p className="text-sm text-gray-300">vs {viirs.weekAgo.toLocaleString()} a week ago ({pct(viirs.now, viirs.weekAgo) >= 0 ? '+' : ''}{pct(viirs.now, viirs.weekAgo)}%)</p>}
                    {viirs.lastYear !== null && viirs.lastYear > 0 && (
                      <p className="text-sm text-gray-300">
                        vs {viirs.lastYear.toLocaleString()} on the same day last year ({pct(viirs.now, viirs.lastYear) >= 0 ? '+' : ''}
                        {pct(viirs.now, viirs.lastYear)}%)
                      </p>
                    )}
                  </>
                )}
              </Card>
              <Card title={`Compared with a normal ${MONTH_NAMES[monthIdx]} (MODIS, since 2001)`} accent="#f59e0b">
                {modisNow === undefined ? (
                  loadingText
                ) : modisNow === null ? (
                  failText
                ) : (
                  <>
                    <p className="text-3xl font-bold text-amber-300">
                      {pct(modisNow, thisMonthAvg) >= 0 ? '+' : ''}
                      {pct(modisNow, thisMonthAvg)}%
                    </p>
                    <p className="text-sm text-gray-300">
                      MODIS fire index {modisNow.toLocaleString()} vs an average of {Math.round(thisMonthAvg).toLocaleString()} for {MONTH_NAMES[monthIdx]}.
                    </p>
                  </>
                )}
              </Card>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="font-semibold text-gray-200 mb-2">Hotspot regions ranked ({day})</p>
              {regions === undefined ? (
                loadingText
              ) : (
                <ol className="space-y-1 text-sm">
                  {regions!.map((r, i) => (
                    <li key={r.country} className="flex items-center gap-2">
                      <span className="w-5 text-gray-400">{i + 1}.</span>
                      <span className="w-24">{r.country}</span>
                      <span className="flex-1 h-2 bg-slate-700 rounded">
                        <span
                          className="block h-2 rounded bg-gradient-to-r from-amber-400 to-red-500"
                          style={{ width: `${Math.min(100, ((r.value ?? 0) / Math.max(0.01, regions![0].value ?? 1)) * 100)}%` }}
                        />
                      </span>
                      <span className="w-14 text-right text-gray-300">{r.value === null ? 'n/a' : r.value.toFixed(1) + '%'}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="font-semibold text-gray-200 mb-2">How does {MONTH_NAMES[monthIdx]} compare over the years? (MODIS, world)</p>
              <BarChart
                data={monthHistory.map((m) => ({ label: String(m.year), value: m.value, color: '#f59e0b' }))}
                height={190}
                highlightMax
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3 text-sm">
            <Card title="When does the world burn most?" accent="#a78bfa">
              <p className="text-gray-200">
                <b>{MONTH_NAMES[busiestMonth]}</b> is the busiest fire month. {MONTH_NAMES[monthIdx]} ranks <b>#{monthRank}</b> of 12.
              </p>
            </Card>
            <Card title="Which year burned most (since 2001)?" accent="#f97316">
              <p className="text-gray-200">
                <b>{busiestYear?.year}</b>. Recent years:{' '}
                {recentYears.map((y) => `${y.year} (${Math.round((y.value / busiestYear.value) * 100)}%)`).join(', ')} of that year.
              </p>
            </Card>
            <Card title="Where are the biggest fire areas?" accent="#ef4444">
              <ol className="list-decimal pl-4 text-gray-200">
                {places.map((p) => (
                  <li key={p.i}>{p.name.replace(/ \(.*/, '')}</li>
                ))}
              </ol>
            </Card>
          </div>
          {burned && (
            <p className="text-sm text-gray-300">
              🌍 Burned area so far in {burned.cur} (to week {burned.wk}): <b>{formatHa(burned.value)}</b> vs an average of {formatHa(burned.avg)} by the same week
              (GWIS). See the Fire Analysis tab for full graphs and country comparisons.
            </p>
          )}
        </section>

        {/* Other hazards */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-cyan-400">🌐 Earthquakes, alerts and space weather</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Card title="Earthquakes, last 24 h (M2.5+)" accent={EVENT_STYLE.earthquake.color}>
              {quakes === undefined ? loadingText : quakes === null ? failText : <p className="text-3xl font-bold text-yellow-300">{quakes.length}</p>}
              {biggestQuake && (
                <p className="text-xs text-gray-300">
                  Largest: M{biggestQuake.magnitude?.toFixed(1)} – {biggestQuake.title.replace(/^M [\d.]+ - /, '')}
                </p>
              )}
            </Card>
            <Card title="Orange & red disaster alerts (3 days)" accent={ALERT_COLORS.Orange.color}>
              {alerts === undefined ? loadingText : alerts === null ? failText : <p className="text-3xl font-bold text-orange-300">{redOrange.length}</p>}
              <ul className="text-xs text-gray-300">
                {redOrange.slice(0, 3).map((a) => (
                  <li key={a.id}>
                    {EVENT_STYLE[a.kind].icon} {a.title}
                  </li>
                ))}
              </ul>
            </Card>
            <Card title="Natural events still active (NASA)" accent={EVENT_STYLE.volcano.color}>
              {events === undefined ? loadingText : events === null ? failText : <p className="text-3xl font-bold text-fuchsia-300">{events.length}</p>}
              <ul className="text-xs text-gray-300">
                {(events || []).slice(0, 3).map((e) => (
                  <li key={e.id}>
                    {EVENT_STYLE[e.kind].icon} {e.title}
                  </li>
                ))}
              </ul>
            </Card>
            <Card title="Magnetic field (Kp index)" accent={kpColor}>
              {kp === undefined ? (
                loadingText
              ) : kp === null ? (
                failText
              ) : (
                <>
                  <p className="text-3xl font-bold" style={{ color: kpColor }}>
                    {kp.last.kp.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-300">
                    Highest in the last 24 h: {kp.max24.toFixed(1)} · NOAA storm scale G{kp.scale?.level ?? 0}
                  </p>
                </>
              )}
            </Card>
          </div>
        </section>

        <p className="text-xs text-gray-500">
          Sources: NASA GIBS (MODIS and VIIRS fire detections), NASA EONET, USGS, GDACS (UN / European Commission), NOAA SWPC, GWIS via Our World in Data. Fire
          pixel counts are measured by this app from NASA&apos;s fire maps and are an index, not an exact number of fires. Long-term averages come from{' '}
          {FULL_YEARS[0]}–{FULL_YEARS[FULL_YEARS.length - 1]}. This year is {year}.
        </p>
      </div>
    </div>
  )
}
