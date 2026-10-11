'use client'
import { useState, useRef, useEffect } from 'react'

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
  'magnetosphere': 'The magnetosphere is the protective bubble created by Earth\'s magnetic field. It deflects most of the solar wind around our planet. On the Sun side it is squeezed to about 10 Earth radii; on the night side it stretches into a long tail.',
  'solar wind': 'The solar wind is a stream of charged particles flowing from the Sun at 300-800 km/s. Fast wind and a southward Bz make the magnetosphere shrink and trigger geomagnetic storms.',
  'solar storm': 'A solar storm happens when a coronal mass ejection or fast solar wind hits Earth. It squeezes the magnetosphere, can disturb satellites and radio, and creates bright auroras.',
  'gravit': 'Gravity and magnetism are different! Gravity pulls masses together and is not changed by the Sun\'s storms. The thing that gets squeezed and stretched in a solar storm is Earth\'s magnetic field (the magnetosphere).',
  'magnetic field': 'Earth\'s magnetic field is made by moving liquid iron in the outer core. It acts like a giant bar magnet and shields us from solar radiation.',
  'sky blue': 'Sunlight contains all colours. Air molecules scatter short (blue) wavelengths much more than long (red) ones, so blue light reaches your eyes from every direction. This is called Rayleigh scattering. At sunset the light travels through more air, so the blue is scattered away and the sky looks red and orange.',
  'photosynthesis': 'Plants make their own food using sunlight, water and carbon dioxide. Chlorophyll in their leaves captures the light and turns it into sugar, releasing oxygen as a by-product.',
  'fire patterns': 'Fire patterns vary by region: Amazon experiences deforestation burns, Siberia has boreal forest fires, Australia has bushfires.'
}

type Photo = { src: string; title: string; url: string }
type Msg = { role: 'user' | 'assistant'; content: string; photos?: Photo[]; source?: { label: string; url: string } }

const FILLER = /^(please |can you |could you |tell me |explain |i want to know |i wanna know )*(what('s| is| are| was| were)|who (is|was|are)|why (is|are|does|do|did)|how (does|do|did|is|are|can)|when (is|was|did|do)|where (is|are|does|do)|define|describe|show me( photos? of| pictures? of| images? of)?|photos? of|pictures? of|images? of)\s+/i

function cleanQuery(text: string) {
  let q = text.trim().replace(/[?!.]+$/g, '')
  // Photo requests: search just the subject. Other questions: search the full question (works better for "why/how").
  if (!/^(show me|photos? of|pictures? of|images? of)/i.test(q)) return q
  q = q.replace(FILLER, '').replace(/^(the|a|an)\s+/i, '')
  return q || text
}

// Looks up any topic on Wikipedia: returns a short explanation + photos.
async function wikiLookup(query: string): Promise<{ title: string; text: string; url: string; photos: Photo[] } | null> {
  const api =
    'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search' +
    `&gsrsearch=${encodeURIComponent(query)}&gsrlimit=4&prop=pageimages|extracts|info&inprop=url` +
    '&exintro=1&explaintext=1&exsentences=4&piprop=thumbnail&pithumbsize=600'
  const res = await fetch(api)
  if (!res.ok) return null
  const data = await res.json()
  const pages: any[] = Object.values(data?.query?.pages || {}).sort((a: any, b: any) => a.index - b.index)
  const good = pages.filter((p) => p.extract && !/may refer to|disambiguation/i.test(p.extract))
  if (!good.length) return null
  const main = good[0]
  const photos: Photo[] = good
    .filter((p) => p.thumbnail?.source)
    .slice(0, 3)
    .map((p) => ({ src: p.thumbnail.source, title: p.title, url: p.fullurl }))
  return { title: main.title, text: main.extract.trim(), url: main.fullurl, photos }
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'Hello! I\'m the Cosmic Era Science Assistant. Ask me about anything in science — volcanoes, black holes, DNA, the Moon, hotspots, auroras — and I\'ll explain it and show photos!' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [messages, isLoading])

  const suggestedQuestions = [
    'What are hotspots and how are they detected?',
    'What is the magnetosphere?',
    'Is the magnetic field the same as gravity?',
    'What are auroras?',
    'How do black holes work?',
    'Why is the sky blue?',
    'What causes volcanoes?',
    'Show me photos of the Milky Way'
  ]

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setIsLoading(true)

    const lower = text.toLowerCase()
    let local: string | null = null
    for (const [key, value] of Object.entries(KNOWLEDGE_BASE)) {
      if (lower.includes(key)) { local = value; break }
    }

    let wiki: Awaited<ReturnType<typeof wikiLookup>> = null
    try {
      wiki = await wikiLookup(cleanQuery(text))
    } catch {
      wiki = null
    }

    let reply: Msg
    if (local) {
      reply = { role: 'assistant', content: local, photos: wiki?.photos, source: wiki ? { label: `More on Wikipedia: ${wiki.title}`, url: wiki.url } : undefined }
    } else if (wiki) {
      reply = { role: 'assistant', content: wiki.text, photos: wiki.photos, source: { label: `Source: Wikipedia — ${wiki.title}`, url: wiki.url } }
    } else {
      reply = { role: 'assistant', content: 'Hmm, I couldn\'t find that. Check your internet connection, or try different words — for example "volcano" or "how do plants make food?".' }
    }
    setMessages(prev => [...prev, reply])
    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Chat Display */}
      <div className="bg-slate-700/30 rounded-lg p-4 h-[28rem] overflow-y-auto space-y-4 border border-cyan-500/20">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] sm:max-w-md px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-600 text-gray-100'}`}>
              <p>{msg.content}</p>
              {msg.photos && msg.photos.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {msg.photos.map((ph, k) => (
                    <a key={k} href={ph.url} target="_blank" rel="noopener noreferrer" className="block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ph.src} alt={ph.title} loading="lazy" className="w-full h-24 object-cover rounded" />
                      <span className="block text-[10px] text-gray-300 mt-1 truncate">{ph.title}</span>
                    </a>
                  ))}
                </div>
              )}
              {msg.source && (
                <a href={msg.source.url} target="_blank" rel="noopener noreferrer" className="block mt-2 text-xs text-cyan-300 underline">
                  {msg.source.label}
                </a>
              )}
            </div>
          </div>
        ))}
        {isLoading && <div className="text-gray-400 text-sm">Searching the science library...</div>}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
          placeholder="Ask any science question..."
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
        <p className="text-xs text-gray-500">Answers and photos come from Wikipedia (free, CC BY-SA). Always double-check important facts.</p>
      </div>
    </div>
  )
}
