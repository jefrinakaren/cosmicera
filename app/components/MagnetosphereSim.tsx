'use client'
import { useEffect, useRef } from 'react'

/**
 * Size of the magnetosphere on the Sun-facing side, in Earth radii (Shue et al. 1998 model).
 * Faster, denser solar wind squeezes it; a southward magnetic field (negative Bz) squeezes it more.
 */
export function magnetopauseDistance(speed: number, bz: number, density = 5) {
  const pdyn = 1.6726e-6 * density * speed * speed // dynamic pressure in nanopascals
  const b = Math.max(-20, Math.min(20, bz))
  const r0 = (10.22 + 1.29 * Math.tanh(0.184 * (b + 8.14))) * Math.pow(pdyn, -1 / 6.6)
  const alpha = (0.58 - 0.007 * b) * (1 + 0.024 * Math.log(pdyn))
  return { r0, alpha, pdyn }
}

type Props = { speed: number; bz: number; kp: number; height?: number }

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

type Particle = { x: number; y: number; vx: number; vy: number; jit: number; sheath: boolean }
type Rain = { l: number; u: number; side: number }

export default function MagnetosphereSim({ speed, bz, kp, height = 400 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const target = useRef({ speed, bz, kp })
  target.current = { speed, bz, kp }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    let raf = 0
    let w = 0
    let h = 0
    const cur = { ...target.current }
    const particles: Particle[] = []
    const rain: Rain[] = []

    const spawn = (p: Particle, anywhere: boolean) => {
      p.x = anywhere ? Math.random() * w : -10 - Math.random() * 40
      p.y = Math.random() * h
      p.vx = 0
      p.vy = 0
      p.jit = 0.8 + Math.random() * 0.4
      p.sheath = false
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (particles.length === 0) {
        for (let i = 0; i < 280; i++) {
          const p = { x: 0, y: 0, vx: 0, vy: 0, jit: 1, sheath: false }
          spawn(p, true)
          particles.push(p)
        }
        for (let i = 0; i < 70; i++) rain.push({ l: 3 + Math.random() * 4, u: Math.random(), side: Math.random() < 0.5 ? -1 : 1 })
      }
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const draw = (time: number) => {
      // Ease towards the target values so changes look smooth
      const k = 0.05
      cur.speed += (target.current.speed - cur.speed) * k
      cur.bz += (target.current.bz - cur.bz) * k
      cur.kp += (target.current.kp - cur.kp) * k

      const { r0, alpha } = magnetopauseDistance(cur.speed, cur.bz)
      const re = Math.min(w * 0.06, h * 0.085) // pixels per Earth radius
      const ex = w * 0.64
      const ey = h * 0.5
      const south = clamp(-cur.bz / 15, 0, 1)
      const activity = clamp(Math.max(cur.kp / 9, south * 0.85 + (cur.speed - 300) / 1800), 0, 1)

      // Radius of the magnetopause (px) at angle theta from the Sun direction
      const rmp = (theta: number) => r0 * re * Math.pow(2 / (1 + Math.cos(Math.min(theta, 2.5))), alpha)
      const edge = (theta: number, scale: number, sign: number) => {
        const r = rmp(theta) * scale
        return [ex - r * Math.cos(theta), ey + sign * r * Math.sin(theta)] as const
      }

      ctx.clearRect(0, 0, w, h)

      // Sun glow on the left
      const sun = ctx.createRadialGradient(-w * 0.04, ey, 0, -w * 0.04, ey, h * 0.95)
      sun.addColorStop(0, 'rgba(255, 214, 90, 0.55)')
      sun.addColorStop(0.35, 'rgba(255, 150, 40, 0.16)')
      sun.addColorStop(1, 'rgba(255, 150, 40, 0)')
      ctx.fillStyle = sun
      ctx.fillRect(0, 0, w, h)

      // Bow shock (dashed) and magnetopause (solid)
      const curve = (scale: number) => {
        ctx.beginPath()
        for (let t = 2.3; t >= 0; t -= 0.05) {
          const [x, y] = edge(t, scale, -1)
          if (t === 2.3) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        for (let t = 0.05; t <= 2.3; t += 0.05) {
          const [x, y] = edge(t, scale, 1)
          ctx.lineTo(x, y)
        }
      }
      ctx.save()
      ctx.setLineDash([6, 6])
      ctx.strokeStyle = 'rgba(255, 190, 90, 0.55)'
      ctx.lineWidth = 1.5
      curve(1.32)
      ctx.stroke()
      ctx.restore()

      curve(1)
      ctx.fillStyle = 'rgba(52, 211, 153, 0.07)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.9)'
      ctx.lineWidth = 2
      ctx.stroke()

      // Magnetic field lines (a dipole, squashed on the Sun side and stretched into a tail)
      const stretch = 0.35 + south * 1.6 + activity * 0.6
      ctx.lineWidth = 1.2
      for (const L of [2, 3.2, 4.6, 6.5, 9]) {
        const phiMax = Math.acos(Math.sqrt(1 / L))
        const dayScale = Math.min(1, (r0 * 0.97) / L)
        const nightScale = 1 + stretch * Math.pow(L / 9, 1.6)
        for (const lobe of [-1, 1]) {
          // lobe -1 = Sun side (left), lobe +1 = night side (right)
          ctx.beginPath()
          for (let i = 0; i <= 40; i++) {
            const phi = -phiMax + (2 * phiMax * i) / 40
            const xb = L * Math.pow(Math.cos(phi), 3)
            const yb = L * Math.pow(Math.cos(phi), 2) * Math.sin(phi)
            const x = ex + lobe * xb * (lobe === -1 ? dayScale : nightScale) * re
            const y = ey - yb * (lobe === -1 ? dayScale : 1) * re
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.strokeStyle = `rgba(167, 139, 250, ${0.6 - L * 0.04})`
          ctx.stroke()
        }
      }

      // Earth
      const earth = ctx.createRadialGradient(ex - re * 0.45, ey - re * 0.3, re * 0.1, ex, ey, re)
      earth.addColorStop(0, '#6cb6ff')
      earth.addColorStop(0.65, '#1d5fb8')
      earth.addColorStop(1, '#0b2a5b')
      ctx.beginPath()
      ctx.arc(ex, ey, re, 0, Math.PI * 2)
      ctx.fillStyle = earth
      ctx.fill()
      // night side shadow
      ctx.save()
      ctx.beginPath()
      ctx.arc(ex, ey, re, -Math.PI / 2, Math.PI / 2)
      ctx.fillStyle = 'rgba(5, 8, 25, 0.5)'
      ctx.fill()
      ctx.restore()

      // Auroras: rings around both poles that grow towards the equator in a storm
      const latDeg = 70 - 15 * activity
      const colat = ((90 - latDeg) * Math.PI) / 180
      const flicker = 0.75 + 0.25 * Math.sin(time / 260) + 0.1 * Math.sin(time / 97)
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      for (const pole of [-1, 1]) {
        const cy = ey + pole * re * Math.cos(colat)
        const rx = re * Math.sin(colat)
        ctx.beginPath()
        ctx.ellipse(ex, cy, rx, rx * 0.28, 0, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(90, 255, 170, ${clamp((0.25 + 0.75 * activity) * flicker, 0, 1)})`
        ctx.lineWidth = Math.max(2, re * (0.09 + 0.1 * activity))
        ctx.shadowColor = 'rgba(90, 255, 170, 0.9)'
        ctx.shadowBlur = 8 + 16 * activity
        ctx.stroke()
        ctx.beginPath()
        ctx.ellipse(ex, cy, rx * 0.93, rx * 0.25, 0, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(255, 90, 200, ${clamp(0.15 * activity * flicker, 0, 1)})`
        ctx.lineWidth = Math.max(1, re * 0.05)
        ctx.stroke()
      }
      ctx.restore()

      // Solar wind particles
      const base = 1.6 + cur.speed / 190
      for (const p of particles) {
        if (!reduceMotion) {
          if (p.vx === 0) {
            p.vx = base * p.jit
            p.vy = 0
          }
          p.x += p.vx
          p.y += p.vy
          const dx = p.x - ex
          const dy = p.y - ey
          const dist = Math.hypot(dx, dy) || 1
          const theta = Math.acos(clamp(-dx / dist, -1, 1))
          if (theta < 2.2) {
            const mp = rmp(theta)
            if (dist < mp * 1.32) p.sheath = true
            if (dist < mp * 1.02) {
              // slide around the magnetopause
              const ux = dx / dist
              const uy = dy / dist
              let tx = -uy
              let ty = ux
              if (tx < 0) {
                tx = -tx
                ty = -ty
              }
              p.x = ex + ux * mp * 1.02
              p.y = ey + uy * mp * 1.02
              p.vx = tx * base * 0.9 * p.jit
              p.vy = ty * base * 0.9 * p.jit
            }
          }
          if (p.x > w + 10 || p.y < -10 || p.y > h + 10 || p.x < -60) {
            spawn(p, false)
            p.vx = 0
          }
        }
        ctx.fillStyle = p.sheath ? 'rgba(255, 140, 60, 0.9)' : 'rgba(255, 224, 120, 0.85)'
        ctx.fillRect(p.x, p.y, 2, 2)
      }

      // Particles racing down the field lines into the poles (they cause the aurora)
      const active = Math.floor(rain.length * clamp(activity * 1.2, 0, 1))
      ctx.fillStyle = 'rgba(120, 255, 190, 0.95)'
      for (let i = 0; i < active; i++) {
        const r = rain[i]
        if (!reduceMotion) r.u += 0.012 + activity * 0.01
        if (r.u > 1) r.u = 0
        const phiMax = Math.acos(Math.sqrt(1 / r.l))
        const phi = r.u * phiMax * r.side
        const nightScale = 1 + stretch * Math.pow(r.l / 9, 1.6)
        const x = ex + r.l * Math.pow(Math.cos(phi), 3) * nightScale * re
        const y = ey - r.l * Math.pow(Math.cos(phi), 2) * Math.sin(phi) * re
        ctx.fillRect(x - 1, y - 1, 3, 3)
      }

      // Labels
      ctx.font = `${Math.max(11, Math.round(w / 62))}px -apple-system, Segoe UI, sans-serif`
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
      ctx.textAlign = 'left'
      ctx.fillText('☀️ Sun', 12, 22)
      ctx.fillText('Solar wind →', 12, 42)
      ctx.fillStyle = 'rgba(255, 190, 90, 0.95)'
      const [bx, by] = edge(0.5, 1.32, -1)
      ctx.fillText('Bow shock', clamp(bx - 70, 8, w - 90), clamp(by - 6, 14, h - 6))
      ctx.fillStyle = 'rgba(52, 211, 153, 1)'
      const [mx, my] = edge(0.35, 1, 1)
      ctx.fillText('Magnetopause', clamp(mx - 40, 8, w - 110), clamp(my + 18, 14, h - 6))
      ctx.fillStyle = 'rgba(190, 170, 255, 0.95)'
      ctx.textAlign = 'right'
      ctx.fillText('Magnetic tail →', w - 10, ey - re * 3.2)
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.textAlign = 'center'
      ctx.fillText('Earth', ex, ey + re + 15)
      ctx.fillStyle = 'rgba(120, 255, 190, 0.95)'
      ctx.fillText('Aurora', ex, ey - re * 1.45)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-lg bg-slate-900 border border-cyan-500/20"
      style={{ height }}
      role="img"
      aria-label="Animation of the solar wind hitting Earth's magnetic field. The field is squeezed on the Sun side and stretched into a long tail on the night side."
    />
  )
}
