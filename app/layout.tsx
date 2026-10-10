import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cosmic Era - NASA Space Apps',
  description: 'Real-time Earth monitoring through satellite data and magnetic field visualization',
  keywords: 'NASA, satellite, hotspot, magnetic field, earth observation'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-900">{children}</body>
    </html>
  )
}
