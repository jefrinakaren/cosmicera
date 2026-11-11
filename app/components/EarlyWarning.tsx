'use client'
import { useEffect, useMemo, useState } from 'react'
import { ALERT_COLORS, EVENT_STYLE, EventKind } from '../lib/colors'
import { Hazard, fetchGdacs, fetchQuakes } from '../lib/hazards'
import ColorGuide from './ColorLegend'

type System = { name: string; who: string; what: string; speed: string; url: string }

const SYSTEMS: { kind: EventKind; systems: System[] }[] = [
  {
    kind: 'earthquake',
    systems: [
      { name: 'ShakeAlert', who: 'USGS (USA)', what: 'Detects the first, fast shaking of an earthquake and warns phones on the US West Coast before the strong shaking arrives.', speed: 'Seconds before shaking', url: 'https://www.shakealert.org/' },
      { name: 'Earthquake Early Warning', who: 'Japan Meteorological Agency', what: 'One of the oldest national systems; stops bullet trains and alerts TV and phones.', speed: 'Seconds', url: 'https://www.jma.go.jp/jma/en/Activities/eew.html' },
      { name: 'Latest Earthquakes map', who: 'USGS', what: 'Every earthquake on Earth, updated every minute (used on our Disaster Map).', speed: 'Minutes after', url: 'https://earthquake.usgs.gov/earthquakes/map/' },
      { name: 'Tsunami.gov', who: 'NOAA Tsunami Warning Centers', what: 'Warns coasts when an undersea earthquake may cause a tsunami.', speed: 'Minutes to hours before waves', url: 'https://www.tsunami.gov/' },
      { name: 'National Seismic Network', who: 'UAE National Center of Meteorology', what: 'Monitors earthquakes felt in the UAE and the region.', speed: 'Minutes after', url: 'https://www.ncm.gov.ae/' },
    ],
  },
  {
    kind: 'volcano',
    systems: [
      { name: 'Weekly Volcanic Activity Report', who: 'Smithsonian Global Volcanism Program', what: 'Every week: which volcanoes are erupting or restless around the world.', speed: 'Days to weeks of warning signs', url: 'https://volcano.si.edu/reports_weekly.cfm' },
      { name: 'Volcano Hazards Program', who: 'USGS', what: 'Watches volcanoes with seismometers, GPS and gas sensors and sets colour-coded alert levels.', speed: 'Days to weeks', url: 'https://www.usgs.gov/programs/VHP' },
      { name: 'Volcanic Ash Advisory Centers', who: 'NOAA and 8 other centres', what: 'Warn airplanes about ash clouds, which can stop jet engines.', speed: 'Hours', url: 'https://www.ssd.noaa.gov/VAAC/' },
    ],
  },
  {
    kind: 'flood',
    systems: [
      { name: 'GloFAS – Global Flood Awareness System', who: 'Copernicus (European Union)', what: 'Forecasts river floods for the whole world.', speed: 'Up to 30 days ahead', url: 'https://global-flood.emergency.copernicus.eu/' },
      { name: 'National Water Prediction Service', who: 'NOAA (USA)', what: 'River levels and flood forecasts for thousands of rivers.', speed: 'Hours to days', url: 'https://water.noaa.gov/' },
      { name: 'Weather warnings', who: 'UAE National Center of Meteorology', what: 'Rain, flood, fog and heat warnings for the UAE.', speed: 'Hours to days', url: 'https://www.ncm.gov.ae/' },
    ],
  },
  {
    kind: 'wildfire',
    systems: [
      { name: 'FIRMS', who: 'NASA', what: 'Fire detections from MODIS and VIIRS (the same data as our Hotspot Map), with free email alerts for any area.', speed: 'About 3 hours after a satellite pass', url: 'https://firms.modaps.eosdis.nasa.gov/' },
      { name: 'GWIS – Global Wildfire Information System', who: 'European Commission JRC', what: 'Fire danger forecasts and burned-area statistics for every country (used in our Fire Analysis).', speed: 'Up to 10 days ahead (fire danger)', url: 'https://gwis.jrc.ec.europa.eu/' },
      { name: 'EFFIS', who: 'Copernicus (European Union)', what: 'Fire danger and active fires for Europe, the Middle East and North Africa.', speed: 'Days ahead', url: 'https://forest-fire.emergency.copernicus.eu/' },
    ],
  },
  {
    kind: 'heat',
    systems: [
      { name: 'HeatRisk', who: 'NOAA National Weather Service (USA)', what: 'A 7-day colour map (green to magenta) of how dangerous the heat is for people.', speed: '7 days ahead', url: 'https://www.wpc.ncep.noaa.gov/heatrisk/' },
      { name: 'Early Warnings for All', who: 'World Meteorological Organization (UN)', what: 'The UN plan to protect every person on Earth with early warnings by 2027.', speed: '–', url: 'https://wmo.int/activities/early-warnings-all' },
    ],
  },
  {
    kind: 'oil',
    systems: [
      { name: 'IncidentNews', who: 'NOAA Office of Response and Restoration', what: 'Reports on oil and chemical spills in US waters and how they are cleaned up.', speed: 'Hours after', url: 'https://incidentnews.noaa.gov/' },
      { name: 'CleanSeaNet', who: 'European Maritime Safety Agency', what: 'Uses radar satellites to spot oil slicks on the sea, even at night and through clouds.', speed: 'Within about 30 minutes of a satellite image', url: 'https://www.emsa.europa.eu/csn-menu.html' },
    ],
  },
  {
    kind: 'storm',
    systems: [
      { name: 'GDACS', who: 'United Nations and European Commission', what: 'Alerts for earthquakes, cyclones, floods, volcanoes, droughts and fires worldwide, with Green, Orange and Red levels (shown live below).', speed: 'Minutes to days', url: 'https://www.gdacs.org/' },
      { name: 'National Hurricane Center', who: 'NOAA (USA)', what: 'Tracks and forecasts hurricanes in the Atlantic and eastern Pacific.', speed: 'Up to 7 days ahead', url: 'https://www.nhc.noaa.gov/' },
      { name: 'EONET', who: 'NASA', what: 'A live list of natural events seen from space (used on our Disaster Map).', speed: 'Hours to days', url: 'https://eonet.gsfc.nasa.gov/' },
    ],
  },
]

const HEAT_LINKS: { kind: EventKind; answer: 'Yes' | 'Sometimes' | 'No'; why: string }[] = [
  { kind: 'wildfire', answer: 'Yes', why: 'A heatwave dries out grass, leaves and trees, so a spark (lightning, a cigarette, farm burning) turns into a fire that spreads fast.' },
  { kind: 'drought', answer: 'Yes', why: 'Heat makes water evaporate faster from soil, rivers and lakes, so dry spells get worse.' },
  {
    kind: 'flood',
    answer: 'Sometimes',
    why: 'Heat melts snow and glaciers, which can flood rivers. Warmer air holds about 7% more water for every 1 °C, so storms can dump heavier rain. And ground baked hard or burned by fire cannot soak up rain, causing flash floods.',
  },
  { kind: 'storm', answer: 'Sometimes', why: 'Hurricanes and cyclones get their energy from warm sea water, so hotter oceans can make them stronger.' },
  {
    kind: 'earthquake',
    answer: 'No',
    why: 'Earthquakes happen when the rocky plates of the crust slip, kilometres underground. Summer heat only warms the top few metres of the ground, so it cannot cause earthquakes.',
  },
  {
    kind: 'volcano',
    answer: 'No',
    why: "Magma comes from Earth's own inner heat, which leaks out from the core and mantle (see the Earth layers in the Magnetic Field tab). Weather is far too weak and shallow to affect it.",
  },
  {
    kind: 'oil',
    answer: 'No',
    why: 'Oil spills are caused by accidents with ships, pipelines and oil wells. Heat does not cause them, but hurricanes (powered by warm seas) can damage oil platforms, and heat makes spilled oil give off more harmful fumes.',
  },
]

const ANSWER_COLOR = { Yes: '#ef4444', Sometimes: '#f97316', No: '#22c55e' }

export default function EarlyWarning() {
  const [alerts, setAlerts] = useState<Hazard[] | null>(null)
  const [quakes, setQuakes] = useState<Hazard[] | null>(null)
  const [err, setErr] = useState<string[]>([])
  const [filter, setFilter] = useState<'all' | EventKind>('all')
  const [updated, setUpdated] = useState<Date | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = () => {
      Promise.allSettled([fetchGdacs(14), fetchQuakes('day', '2.5')]).then(([g, q]) => {
        if (cancelled) return
        const e: string[] = []
        if (g.status === 'fulfilled') setAlerts(g.value)
        else e.push('GDACS')
        if (q.status === 'fulfilled') setQuakes(q.value)
        else e.push('USGS')
        setErr(e)
        setUpdated(new Date())
      })
    }
    load()
    const t = setInterval(load, 10 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  const shownAlerts = useMemo(() => {
    const order = { Red: 0, Orange: 1, Green: 2 }
    return (alerts || [])
      .filter((a) => filter === 'all' || a.kind === filter)
      .sort((a, b) => order[a.alert || 'Green'] - order[b.alert || 'Green'] || (b.date > a.date ? 1 : -1))
  }, [alerts, filter])

  const alertCounts = useMemo(() => {
    const c = { Red: 0, Orange: 0, Green: 0 }
    for (const a of alerts || []) if (a.alert) c[a.alert]++
    return c
  }, [alerts])

  const bigQuakes = (quakes || []).filter((q) => (q.magnitude ?? 0) >= 4.5)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text">🚨 Early Warning Centre</h1>
          <p className="text-gray-300 mt-2 max-w-3xl">
            Scientists around the world watch the planet day and night so they can warn people <b>before</b> a disaster hits. This page shows the live alerts they
            are sending right now, the warning systems they use, and which disasters are linked to heat.
          </p>
        </header>

        {/* Live status */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(['Red', 'Orange', 'Green'] as const).map((lvl) => (
            <div key={lvl} className="rounded-lg p-4 bg-slate-800/70 border-l-4" style={{ borderColor: ALERT_COLORS[lvl].color }}>
              <p className="text-sm text-gray-400">{lvl} alerts (last 14 days)</p>
              <p className="text-3xl font-bold" style={{ color: ALERT_COLORS[lvl].color }}>
                {alerts ? alertCounts[lvl] : '…'}
              </p>
            </div>
          ))}
          <div className="rounded-lg p-4 bg-slate-800/70 border-l-4" style={{ borderColor: EVENT_STYLE.earthquake.color }}>
            <p className="text-sm text-gray-400">Earthquakes in the last 24 h</p>
            <p className="text-3xl font-bold text-yellow-300">{quakes ? quakes.length : '…'}</p>
            <p className="text-xs text-gray-400">{quakes ? `${bigQuakes.length} of them magnitude 4.5 or more` : ''}</p>
          </div>
        </section>
        {err.length > 0 && <p className="text-sm text-amber-300">⚠️ Could not reach {err.join(' and ')} right now. Try again in a few minutes.</p>}

        {/* Live alerts list */}
        <section className="bg-slate-800/50 rounded-lg p-4 border border-cyan-500/20 space-y-3">
          <div className="flex flex-wrap justify-between gap-2 items-center">
            <h2 className="text-xl font-bold text-cyan-400">Live disaster alerts (GDACS, last 14 days)</h2>
            <span className="text-xs text-gray-400 flex items-center gap-2">
              <span className="live-dot" /> {updated ? `updated ${updated.toLocaleTimeString()}` : 'loading…'} · refreshes every 10 minutes
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {(['all', 'earthquake', 'storm', 'flood', 'volcano', 'drought', 'wildfire'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-3 py-1 rounded-full ${filter === k ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-gray-300'}`}
              >
                {k === 'all' ? 'All' : `${EVENT_STYLE[k].icon} ${EVENT_STYLE[k].label}`}
              </button>
            ))}
          </div>
          <div className="max-h-96 overflow-y-auto space-y-1 pr-1">
            {!alerts && <p className="text-sm text-gray-400">Loading alerts…</p>}
            {alerts && shownAlerts.length === 0 && <p className="text-sm text-gray-400">No alerts of this type in the last 14 days.</p>}
            {shownAlerts.map((a) => (
              <a
                key={a.id}
                href={a.url || 'https://www.gdacs.org/'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-slate-900/60 hover:bg-slate-700 rounded px-3 py-2 text-sm"
              >
                <span className="px-2 py-0.5 rounded text-xs font-bold text-black shrink-0" style={{ background: ALERT_COLORS[a.alert || 'Green'].color }}>
                  {a.alert}
                </span>
                <span>{EVENT_STYLE[a.kind].icon}</span>
                <span className="flex-1">{a.title}</span>
                <span className="text-xs text-gray-400 shrink-0">{new Date(a.date).toLocaleDateString()}</span>
              </a>
            ))}
          </div>
        </section>

        {/* Heat */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-cyan-400">🌡️ Can heat cause these disasters?</h2>
          <p className="text-sm text-gray-300 max-w-3xl">
            Heatwaves are becoming more common as the climate warms, and they make some disasters more likely, but not all of them. Scientists warn about the ones
            that heat <i>can</i> trigger, and use completely different instruments for the ones that come from deep inside the Earth.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {HEAT_LINKS.map((h) => (
              <div key={h.kind} className="bg-slate-800/70 rounded-lg p-4 flex gap-3">
                <div className="text-3xl">{EVENT_STYLE[h.kind].icon}</div>
                <div>
                  <p className="font-bold text-gray-100">
                    Heat → {EVENT_STYLE[h.kind].label}?{' '}
                    <span className="ml-1 px-2 py-0.5 rounded text-xs text-black" style={{ background: ANSWER_COLOR[h.answer] }}>
                      {h.answer}
                    </span>
                  </p>
                  <p className="text-sm text-gray-300 mt-1">{h.why}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How a warning works */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-cyan-400">How does an early warning work?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { n: 1, t: 'Detect', d: 'Satellites, seismometers, river gauges, weather stations and ocean buoys measure the Earth all the time.' },
              { n: 2, t: 'Analyse', d: 'Computers and scientists compare the measurements with what is normal and run forecasts.' },
              { n: 3, t: 'Warn', d: 'Alerts go out by phone, TV, radio, sirens and apps, coloured by how dangerous the event is.' },
              { n: 4, t: 'Act', d: 'People move to safety, trains stop, flights reroute, dams release water and firefighters get ready.' },
            ].map((s) => (
              <div key={s.n} className="bg-slate-800/70 rounded-lg p-4">
                <p className="text-cyan-300 font-bold">
                  {s.n}. {s.t}
                </p>
                <p className="text-sm text-gray-300 mt-1">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Systems directory */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-400">Warning systems scientists use</h2>
          {SYSTEMS.map((g) => (
            <div key={g.kind}>
              <h3 className="font-bold mb-2" style={{ color: EVENT_STYLE[g.kind].color }}>
                {EVENT_STYLE[g.kind].icon} {g.kind === 'storm' ? 'All hazards & cyclones' : EVENT_STYLE[g.kind].label}
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {g.systems.map((s) => (
                  <a
                    key={s.name + s.who}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-slate-800/70 hover:bg-slate-700 rounded-lg p-4 border-l-4 transition"
                    style={{ borderColor: EVENT_STYLE[g.kind].color }}
                  >
                    <p className="font-semibold text-gray-100">{s.name} ↗</p>
                    <p className="text-xs text-gray-400">{s.who}</p>
                    <p className="text-sm text-gray-300 mt-1">{s.what}</p>
                    <p className="text-xs text-cyan-300 mt-1">⏱️ Warning time: {s.speed}</p>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-cyan-400">🎨 What the colours mean</h2>
          <ColorGuide />
        </section>
      </div>
    </div>
  )
}
