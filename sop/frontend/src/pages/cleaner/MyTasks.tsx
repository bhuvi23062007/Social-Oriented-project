import { useState } from 'react'
import { motion } from 'framer-motion'
import { useReports, type Report } from '../../hooks/useReports'
import { api } from '../../lib/api'
import { wasteLabel } from '../../lib/waste'
import LocationBlock from '../../components/LocationBlock'

function TaskCard({ r, onComplete }: { r: Report; onComplete: (id: string, file: File) => Promise<void> }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const before = r.images.find((i) => i.type !== 'AFTER')

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setPreview(URL.createObjectURL(f))
    }
  }

  const submit = async () => {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      await onComplete(r.id, file)
    } catch {
      setError('Could not complete. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-line rounded-xl overflow-hidden">
      {before && <img src={before.url} alt="Before" className="w-full h-40 object-cover" />}
      <div className="p-5">
        <p className="text-xs font-mono text-muted">#{r.id.slice(0, 8)}</p>
        <p className="text-sm font-bold mt-1">{wasteLabel(r.wasteType)}</p>
        <p className="text-sm text-muted mt-0.5">{r.description.split(':')[0]}</p>
        <LocationBlock lat={r.latitude} lng={r.longitude} showMe />

        <div className="mt-4">
          <label className="label text-muted block mb-1.5">After-cleaning photo</label>
          <input type="file" accept="image/*" onChange={pick} className="text-xs w-full" />
          {preview && <img src={preview} alt="After preview" className="mt-2 w-full h-32 object-cover rounded-md border border-line" />}
        </div>

        {error && <p className="text-xs text-glass mt-2">{error}</p>}

        <button
          onClick={submit}
          disabled={!file || busy}
          className="w-full mt-4 bg-ink text-paper py-2 rounded-md text-xs font-medium hover:bg-accent hover:text-white transition-colors disabled:opacity-40"
        >
          {busy ? 'Uploading...' : 'Mark Completed'}
        </button>
      </div>
    </motion.div>
  )
}

function MyTasks() {
  const { reports, loading, complete } = useReports('team', 10000)
  const [tab, setTab] = useState<'active' | 'completed'>('active')

  const active = reports.filter((r) => ['ACCEPTED', 'IN_PROGRESS'].includes(r.status))
  const awaitingVerification = reports.filter((r) => r.status === 'CLEANING_COMPLETED')
  const completed = reports.filter((r) => r.status === 'RESOLVED')

  const handleComplete = async (id: string, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    const up = await api.post('/storage/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    await complete(id, up.data.url)
  }

  if (loading) return <p className="text-muted text-sm">Loading...</p>

  return (
    <div>
      <div className="mb-8">
        <span className="label text-accent">Tasks</span>
        <h1 className="text-3xl font-black tracking-tighter mt-1">My Tasks</h1>
        <p className="text-muted text-sm mt-1">Jobs you accepted or that were assigned to your team</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(['active', 'completed'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-md text-xs font-medium transition-colors ${tab === t ? 'bg-ink text-paper' : 'border border-line text-muted hover:border-accent'}`}>
            {t === 'active' && `Active (${active.length + awaitingVerification.length})`}
            {t === 'completed' && `Completed (${completed.length})`}
          </button>
        ))}
      </div>

      {tab === 'active' &&
        (active.length === 0 && awaitingVerification.length === 0 ? (
          <p className="text-sm text-muted py-16 text-center border border-line rounded-xl">No active tasks right now.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {active.map((r) => (
              <TaskCard key={r.id} r={r} onComplete={handleComplete} />
            ))}
            {awaitingVerification.map((r) => (
              <div key={r.id} className="bg-surface border border-line rounded-xl p-5">
                <p className="text-xs font-mono text-muted">#{r.id.slice(0, 8)}</p>
                <p className="text-sm font-medium mt-1">{wasteLabel(r.wasteType)}</p>
                <p className="text-sm text-muted">{r.description.split(':')[0]}</p>
                <span className="label px-2.5 py-1 rounded-full bg-accent-soft text-plastic inline-block mt-3">awaiting admin verification</span>
              </div>
            ))}
          </div>
        ))}

      {tab === 'completed' &&
        (completed.length === 0 ? (
          <p className="text-sm text-muted py-16 text-center border border-line rounded-xl">No completed pickups yet.</p>
        ) : (
          <div className="space-y-2.5">
            {completed.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-surface border border-line rounded-lg px-4 py-3">
                <div>
                  <p className="text-xs font-mono text-muted">#{r.id.slice(0, 8)}</p>
                  <p className="text-sm font-medium">{wasteLabel(r.wasteType)}</p>
                </div>
                <span className="label px-2.5 py-1 rounded-full bg-accent-soft text-organic">resolved</span>
              </div>
            ))}
          </div>
        ))}
    </div>
  )
}

export default MyTasks