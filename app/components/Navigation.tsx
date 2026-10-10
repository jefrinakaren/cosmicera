'use client'
import { useState } from 'react'

export default function Navigation({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-slate-900 border-b border-cyan-500/20">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('home')}
            className="text-2xl font-bold gradient-text hover:scale-105 transition"
          >
            🌍 COSMIC ERA
          </button>
        </div>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-cyan-400 text-2xl"
        >
          ☰
        </button>

        <div className={`${isOpen ? 'flex' : 'hidden'} md:flex gap-4 absolute md:relative top-16 md:top-0 left-0 md:left-auto right-0 md:right-auto flex-col md:flex-row bg-slate-900 md:bg-transparent p-4 md:p-0 w-full md:w-auto`}>
          <button onClick={() => { onNavigate('home'); setIsOpen(false); }} className="text-cyan-400 hover:text-cyan-300 py-2 md:py-0">Home</button>
          <button onClick={() => { onNavigate('dashboard'); setIsOpen(false); }} className="text-cyan-400 hover:text-cyan-300 py-2 md:py-0">Dashboard</button>
        </div>
      </div>
    </nav>
  )
}
