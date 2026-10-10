'use client'
import { useState } from 'react'
import Navigation from './components/Navigation'
import HomePage from './components/HomePage'
import Dashboard from './components/Dashboard'

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'dashboard'>('home')

  const handleNavigate = (page: string) => {
    setCurrentPage(page as 'home' | 'dashboard')
  }

  return (
    <main className="min-h-screen bg-slate-900">
      <Navigation onNavigate={handleNavigate} />
      {currentPage === 'home' ? (
        <HomePage onNavigate={handleNavigate} />
      ) : (
        <Dashboard />
      )}
    </main>
  )
}
