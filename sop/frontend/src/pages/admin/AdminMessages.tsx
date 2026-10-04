import { useState, useEffect } from 'react'
import { useMessages } from '../../hooks/useMessages'
import { api } from '../../lib/api'

interface Cleaner {
  id: string
  name: string
}

function AdminMessages() {
  const { messages, sendMessage } = useMessages('all')
  const [cleaners, setCleaners] = useState<Cleaner[]>([])
  const [msgCleanerId, setMsgCleanerId] = useState('')
  const [msgLocation, setMsgLocation] = useState('')
  const [msgBody, setMsgBody] = useState('')
  const [msgPriority, setMsgPriority] = useState<'NORMAL' | 'URGENT'>('URGENT')

  useEffect(() => {
    api.get('/users').then((res) => {
      const staff = res.data.filter((u: any) => u.role === 'CLEANING_STAFF')
      setCleaners(staff)
      if (staff.length > 0) setMsgCleanerId(staff[0].id)
    })
  }, [])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!msgLocation || !msgBody || !msgCleanerId) return
    sendMessage(msgCleanerId, msgLocation, msgBody, msgPriority)
    setMsgLocation('')
    setMsgBody('')
  }

  const selectedCleaner = cleaners.find((c) => c.id === msgCleanerId)

  return (
    <div>
      <div className="mb-8">
        <span className="label text-accent">Messages</span>
        <h1 className="text-3xl font-black tracking-tighter mt-1">Messages</h1>
        <p className="text-muted text-sm mt-1">Send urgent cleanup requests or updates directly to cleaners</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.3fr] gap-4">
        <div className="bg-surface border border-line rounded-xl p-6">
          <h3 className="text-base font-bold mb-4">Send Task to Cleaner</h3>
          <form onSubmit={handleSend} className="flex flex-col gap-3">
            <div>
              <label className="label text-muted block mb-1.5">Cleaner</label>
              <select value={msgCleanerId} onChange={(e) => setMsgCleanerId(e.target.value)} className="w-full border border-line rounded-md bg-paper px-3 py-2 text-sm focus:outline-none focus:border-accent">
                {cleaners.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-muted block mb-1.5">Location</label>
              <input type="text" value={msgLocation} onChange={(e) => setMsgLocation(e.target.value)} placeholder="e.g. Nungambakkam High Rd" className="w-full border border-line rounded-md bg-paper px-3 py-2 text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="label text-muted block mb-1.5">Message</label>
              <textarea value={msgBody} onChange={(e) => setMsgBody(e.target.value)} rows={3} placeholder="Urgent cleaning required in this area..." className="w-full border border-line rounded-md bg-paper px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none" />
            </div>
            <div className="flex gap-2">
              {(['URGENT', 'NORMAL'] as const).map((p) => (
                <button key={p} type="button" onClick={() => setMsgPriority(p)} className={`flex-1 py-2 rounded-md text-xs font-medium border capitalize transition-colors ${msgPriority === p ? 'bg-ink text-paper border-ink' : 'border-line text-muted hover:border-accent'}`}>
                  {p.toLowerCase()}
                </button>
              ))}
            </div>
            <button type="submit" className="bg-accent text-white py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity mt-1">
              Send to {selectedCleaner?.name.split(' ')[0] ?? 'Cleaner'}
            </button>
          </form>
        </div>

        <div className="bg-surface border border-line rounded-xl p-6">
          <h3 className="text-base font-bold mb-4">Sent Messages</h3>
          {messages.length === 0 ? (
            <p className="text-sm text-muted py-8 text-center">No messages sent yet.</p>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {messages.map((m) => (
                <div key={m.id} className="flex items-center justify-between bg-paper border border-line rounded-lg px-4 py-3 gap-3">
                  <div>
                    <p className="text-sm font-medium">{m.cleaner?.name ?? 'Unknown'} · {m.location}</p>
                    <p className="text-xs text-muted mt-0.5">{m.body}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`label px-2 py-0.5 rounded-full ${m.priority === 'URGENT' ? 'bg-glass text-white' : 'bg-accent-soft text-muted'}`}>{m.priority.toLowerCase()}</span>
                    <p className="text-xs text-muted mt-1 capitalize">{m.status.toLowerCase().replace('_', ' ')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminMessages