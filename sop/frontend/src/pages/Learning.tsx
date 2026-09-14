import { useState } from 'react'
import { motion } from 'framer-motion'

interface Video {
  title: string
  category: string
  youtubeId: string
}

const videos: Video[] = [
  { title: 'Waste Segregation Basics', category: 'Basics', youtubeId:'JlbbVGPATgA'},
  { title: 'Composting at Home', category: 'Organic', youtubeId: 'mDIVpJgjoXQ' },
  { title: 'Recycling Plastics Correctly', category: 'Recycling', youtubeId: 'cNPEH0GOhRw' },
  { title: 'E-Waste: What to Do', category: 'Hazardous', youtubeId: 'w0ikFMTuS9c' },
  //{ title: 'Community Cleanup Drives', category: 'Community', youtubeId: 'wtQR6Vk1Ees' },
  { title: 'Reducing Household Waste', category: 'Basics', youtubeId: 'EGzg77rx7Uo' },
]

function Learning() {
  const [active, setActive] = useState<Video | null>(null)

  return (
    <div>
      <div className="mb-8">
        <span className="label text-accent">Learn</span>
        <h1 className="text-3xl font-black tracking-tighter mt-1">Learn</h1>
        <p className="text-muted text-sm mt-1">Short videos on waste management, sorted for you</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {videos.map((v, i) => (
          <motion.button
            key={v.youtubeId}
            onClick={() => setActive(v)}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            whileHover={{ y: -5, borderColor: 'var(--color-accent)' }}
            className="text-left block bg-surface border border-line rounded-xl overflow-hidden transition-colors"
          >
            <div className="relative h-36">
              <img
                src={`https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`}
                alt={v.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-ink/20 flex items-center justify-center">
                <span className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center text-lg text-ink">▶</span>
              </div>
            </div>
            <div className="p-4">
              <span className="label text-accent">{v.category}</span>
              <h3 className="text-sm font-bold mt-2 leading-snug">{v.title}</h3>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Video player modal */}
      {active && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setActive(null)}
          className="fixed inset-0 bg-ink/80 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface rounded-xl overflow-hidden w-full max-w-3xl"
          >
            <div className="aspect-video">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${active.youtubeId}?autoplay=1`}
                title={active.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-4 flex items-center justify-between">
              <h3 className="text-sm font-bold">{active.title}</h3>
              <button onClick={() => setActive(null)} className="text-xs text-muted hover:text-ink transition-colors">
                Close ✕
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default Learning
