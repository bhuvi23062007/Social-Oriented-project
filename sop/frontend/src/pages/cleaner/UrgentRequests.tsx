import { useMessages } from '../../hooks/useMessages'

const CLEANER_NAME = 'Karthik Raj'

function UrgentRequests() {
  const { messages, updateStatus } = useMessages()
  const urgent = messages.filter((m) => m.cleanerName === CLEANER_NAME && m.priority === 'urgent')

  return (
    <div>
      <div className="mb-8">
        <span className="label text-accent">Urgent</span>
        <h1 className="text-3xl font-black tracking-tighter mt-1">Urgent Requests</h1>
        <p className="text-muted text-sm mt-1">High-priority cleanup requests sent directly by admin</p>
      </div>

      {urgent.length === 0 ? (
        <p className="text-sm text-muted py-16 text-center border border-line rounded-xl">No urgent requests right now.</p>
      ) : (
        <div className="space-y-3">
          {urgent.map((m) => (
            <div key={m.id} className="bg-glass/10 border border-glass rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3">
                  <span className="w-9 h-9 rounded-md bg-glass text-white flex items-center justify-center text-sm flex-shrink-0">!</span>
                  <div>
                    <p className="text-sm font-bold">{m.location}</p>
                    <p className="text-sm text-muted mt-1">{m.body}</p>
                    <p className="text-xs text-muted mt-2">{m.sentAt}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {m.status === 'unread' && (
                    <button onClick={() => updateStatus(m.id, 'accepted')} className="bg-ink text-paper px-4 py-1.5 rounded-md text-xs font-medium hover:bg-accent hover:text-white transition-colors">
                      Accept & Start
                    </button>
                  )}
                  {m.status !== 'unread' && (
                    <span className="label px-2.5 py-1.5 rounded-full bg-accent-soft text-muted capitalize">{m.status.replace('_', ' ')}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default UrgentRequests