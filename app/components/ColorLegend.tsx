'use client'
import { ALERT_COLORS, EVENT_STYLE, EventKind, FIRE_RAMP, KP_RAMP, QUAKE_RAMP, RampStop } from '../lib/colors'

export function EventLegend({ kinds }: { kinds: EventKind[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-300">
      {kinds.map((k) => (
        <span key={k} className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full border border-white/40" style={{ background: EVENT_STYLE[k].color }} />
          {EVENT_STYLE[k].icon} {EVENT_STYLE[k].label}
        </span>
      ))}
    </div>
  )
}

export function RampLegend({ title, ramp, smooth = false }: { title: string; ramp: RampStop[]; smooth?: boolean }) {
  return (
    <div className="text-xs text-gray-300">
      <p className="font-semibold text-gray-200 mb-1">{title}</p>
      {smooth ? (
        <>
          <div className="h-3 rounded" style={{ background: `linear-gradient(90deg, ${ramp.map((s) => s.color).join(',')})` }} />
          <div className="flex justify-between mt-0.5 text-[10px] text-gray-400">
            <span>{ramp[0].label}</span>
            <span>{ramp[Math.floor(ramp.length / 2)].label}</span>
            <span>{ramp[ramp.length - 1].label}</span>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {ramp.map((s) => (
            <span key={s.label} className="flex items-center gap-1">
              <span className="inline-block w-4 h-3 rounded-sm" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function AlertLegend() {
  return (
    <div className="text-xs text-gray-300 space-y-1">
      <p className="font-semibold text-gray-200">GDACS alert level</p>
      {Object.entries(ALERT_COLORS).map(([k, v]) => (
        <p key={k} className="flex items-start gap-2">
          <span className="inline-block w-4 h-3 rounded-sm mt-0.5 shrink-0" style={{ background: v.color }} />
          <span>
            <b>{k}:</b> {v.meaning}
          </span>
        </p>
      ))}
    </div>
  )
}

/** Everything in one card: what each colour means across the whole app. */
export default function ColorGuide() {
  return (
    <div className="grid md:grid-cols-2 gap-5 bg-slate-900/50 rounded-lg p-4 border border-cyan-500/20">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-200">Event colours (all maps)</p>
        <div className="space-y-1 text-xs text-gray-300">
          {(Object.keys(EVENT_STYLE) as EventKind[]).map((k) => (
            <p key={k} className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full border border-white/40 shrink-0" style={{ background: EVENT_STYLE[k].color }} />
              <span>
                {EVENT_STYLE[k].icon} <b>{EVENT_STYLE[k].label}</b> – {EVENT_STYLE[k].note}
              </span>
            </p>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <RampLegend title="🔥 Fire activity (heat maps)" ramp={FIRE_RAMP} smooth />
        <RampLegend title="🌐 Earthquake magnitude" ramp={QUAKE_RAMP} />
        <RampLegend title="🧲 Kp index (magnetic storms)" ramp={KP_RAMP} />
        <AlertLegend />
      </div>
    </div>
  )
}
