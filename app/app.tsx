'use client'
import { useState } from 'react'
import Navigation from './components/Navigation'
import HomePage from './components/HomePage'
import Dashboard, { DashboardTab } from './components/Dashboard'

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'dashboard'>('home')
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('calendar')

  const handleNavigate = (page: string, tab?: DashboardTab) => {
    setCurrentPage(page as 'home' | 'dashboard')
    // A feature card on the home page opens its own tab; the nav bar opens the first tab
    setDashboardTab(tab ?? 'calendar')
  }

  return (
    <main className="min-h-screen bg-slate-900">
      <Navigation onNavigate={handleNavigate} />
      {currentPage === 'home' ? (
        <HomePage onNavigate={handleNavigate} />
      ) : (
        <Dashboard initialTab={dashboardTab} />
      )}
    </main>
  )
}
