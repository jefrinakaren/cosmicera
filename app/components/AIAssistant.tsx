'use client'
import { useState } from 'react'

const KNOWLEDGE_BASE = {
  'hotspots': 'Hotspots are thermal anomalies detected by satellites using infrared sensors. They indicate active fires, volcanic activity, or industrial heat sources.',
  'satellites': 'MODIS (NASA Terra/Aqua) and VIIRS (NOAA) are Earth observation satellites that detect thermal radiation in the 3-14 micrometer wavelength.',
  'wildfire': 'Wildfires are uncontrolled fires spreading through vegetation. Climate change increases frequency by creating hotter, drier conditions.',
  'kp index': 'The Kp Index measures planetary geomagnetic activity on a scale of 0-9. Higher values indicate stronger magnetic storms and better aurora visibility.',
  'aurora': 'Auroras (Northern/Southern Lights) occur when solar wind particles collide with Earth\'s magnetosphere, exciting atmospheric gases.',
  'climate': 'Climate change causes increased hotspot frequency through prolonged droughts, higher temperatures, and longer fire seasons.',
  'earth observation': 'Earth observation uses satellites to monitor land, atmosphere, and oceans. It provides critical data for climate monitoring and disaster response.',
  'orbital mechanics': 'Satellites orbit Earth in predictable paths. Polar-orbiting satellites like MODIS cover the entire globe twice daily.',
  'data processing': 'Satellite data undergoes calibration, geolocation, and quality control before being made available to researchers.',
  'fire patterns': 'Fire patterns vary by region: Amazon experiences deforestation burns, Siberia has boreal forest fires, Australia has bushfires.'
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Hello! I\'m the Cosmic Era AI Assistant. Ask me anything about hotspots, satellites, magnetic fields, or Earth science!' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const suggestedQuestions = [
    'What are hotspots and how are they detected?',
    'How do MODIS and VIIRS satellites work?',
    'What causes wildfires?',
    'What is the Kp Index?',
    'How does climate change affect hotspot frequency?',
    'What are auroras?'
  ]

  const handleSend = (text: string) => {
    if (!text.trim()) return

    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setIsLoading(true)

    setTimeout(() => {
      const lowerText = text.toLowerCase()
      let response = 'I don\'t have information about that topic. Try asking about hotspots, satellites, magnetic fields, or auroras!'

      for (const [key, value] of Object.entries(KNOWLEDGE_BASE)) {
        if (lowerText.includes(key)) {
          response = value
          break
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response }])
      setIsLoading(false)
    }, 500)
  }

  return (
    <div className="space-y-6">
      {/* Chat Display */}
      <div className="bg-slate-700/30 rounded-lg p-4 h-96 overflow-y-auto space-y-4 border border-cyan-500/20">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-600 text-gray-100'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && <div className="text-gray-400 text-sm">AI is thinking...</div>}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
          placeholder="Ask anything about Earth hotspots..."
          className="flex-1 px-4 py-2 bg-slate-700 text-white rounded border border-cyan-500/30 focus:outline-none focus:border-cyan-500"
        />
        <button
          onClick={() => handleSend(input)}
          disabled={isLoading}
          className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded disabled:opacity-50"
        >
          Send
        </button>
      </div>

      {/* Suggested Questions */}
      <div className="space-y-2">
        <p className="text-sm text-gray-400">💡 Try asking:</p>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded transition"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
