import { useState } from 'react'
import { useMessages } from '../../hooks/useMessages'

const cleanerNames = ['Karthik Raj', 'Arjun Dev', 'Meena Iyer']

function AdminMessages() {
  const { messages, sendMessage } = useMessages()
  const [msgCleaner, setMsgCleaner] = useState(cleanerNames[0])
  const [msgLocation, setMsgLocation] = useState('')
  const [msgBody, setMsgBody] = useState('')
  const [msgPriority, setMsgPriority] = useState<'normal' | 'urgent'>('urgent')

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!msgLocation || !msgBody) return
    sendMessage(msgCleaner, msgLocation, msgBody, msgPriority)
    setMsgLocation('')
    setMsgBody('')
  }

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
              <select value={msgCleaner} onChange={(e) => setMsgCleaner(e.target.value)} className="w-full border border-line rounded-md bg-paper px-3 py-2 text-sm focus:outline-none focus:border-accent">
                {cleanerNames.map((n) => <option key={n} value={n}>{n}</option>)}
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
              {(['urgent', 'normal'] as const).map((p) => (
                <button key={p} type="button" onClick={() => setMsgPriority(p)} className={`flex-1 py-2 rounded-md text-xs font-medium border capitalize transition-colors ${msgPriority === p ? 'bg-ink text-paper border-ink' : 'border-line text-muted hover:border-accent'}`}>
                  {p}
                </button>
              ))}
            </div>
            <button type="submit" className="bg-accent text-white py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity mt-1">
              Send to {msgCleaner.split(' ')[0]}
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
                    <p className="text-sm font-medium">{m.cleanerName} · {m.location}</p>
                    <p className="text-xs text-muted mt-0.5">{m.body}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`label px-2 py-0.5 rounded-full ${m.priority === 'urgent' ? 'bg-glass text-white' : 'bg-accent-soft text-muted'}`}>{m.priority}</span>
                    <p className="text-xs text-muted mt-1 capitalize">{m.status.replace('_', ' ')}</p>
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