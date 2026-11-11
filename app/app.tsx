'use client'
import { useState } from 'react'
import Navigation, { Page } from './components/Navigation'
import HomePage from './components/HomePage'
import Dashboard, { DashboardTab } from './components/Dashboard'
import EarlyWarning from './components/EarlyWarning'
import DailyReport from './components/DailyReport'

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('calendar')

  const handleNavigate = (page: string, tab?: DashboardTab) => {
    setCurrentPage(page as Page)
    // A feature card on the home page opens its own tab; the nav bar opens the first tab
    setDashboardTab(tab ?? 'calendar')
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 })
  }

  return (
    <main className="min-h-screen bg-slate-900">
      <Navigation onNavigate={handleNavigate} current={currentPage} />
      {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
      {/* key: opening a different tab from the home page remounts the dashboard on that tab */}
      {currentPage === 'dashboard' && <Dashboard key={dashboardTab} initialTab={dashboardTab} />}
      {currentPage === 'warnings' && <EarlyWarning />}
      {currentPage === 'report' && <DailyReport />}
    </main>
  )
}
