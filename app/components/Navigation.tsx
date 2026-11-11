'use client'
import { useState } from 'react'

export type Page = 'home' | 'dashboard' | 'warnings' | 'report'

const LINKS: { page: Page; label: string }[] = [
  { page: 'home', label: 'Home' },
  { page: 'dashboard', label: 'Dashboard' },
  { page: 'warnings', label: '🚨 Early Warnings' },
  { page: 'report', label: '📰 Daily Report' },
]

export default function Navigation({ onNavigate, current }: { onNavigate: (page: string) => void; current?: Page }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-slate-900 border-b border-cyan-500/20">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('home')} className="text-2xl font-bold gradient-text hover:scale-105 transition">
            🌍 COSMIC ERA
          </button>
        </div>

        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-cyan-400 text-2xl" aria-label="Menu">
          ☰
        </button>

        <div
          className={`${isOpen ? 'flex' : 'hidden'} md:flex gap-5 absolute md:relative top-16 md:top-0 left-0 md:left-auto right-0 md:right-auto flex-col md:flex-row bg-slate-900 md:bg-transparent p-4 md:p-0 w-full md:w-auto`}
        >
          {LINKS.map((l) => (
            <button
              key={l.page}
              onClick={() => {
                onNavigate(l.page)
                setIsOpen(false)
              }}
              className={`py-2 md:py-0 text-left ${current === l.page ? 'text-white font-semibold' : 'text-cyan-400 hover:text-cyan-300'}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
