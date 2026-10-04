import { useMessages } from '../../hooks/useMessages'

function CleanerMessages() {
  const { messages, loading } = useMessages('mine')

  if (loading) return <p className="text-muted text-sm">Loading...</p>

  return (
    <div>
      <div className="mb-8">
        <span className="label text-accent">Messages</span>
        <h1 className="text-3xl font-black tracking-tighter mt-1">Messages</h1>
        <p className="text-muted text-sm mt-1">All messages and updates from admin</p>
      </div>

      {messages.length === 0 ? (
        <p className="text-sm text-muted py-16 text-center border border-line rounded-xl">No messages yet.</p>
      ) : (
        <div className="space-y-2.5">
          {messages.map((m) => (
            <div key={m.id} className="bg-surface border border-line rounded-lg px-4 py-3.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{m.location}</span>
                <span className={`label px-2 py-0.5 rounded-full ${m.priority === 'URGENT' ? 'bg-glass text-white' : 'bg-accent-soft text-muted'}`}>
                  {m.priority.toLowerCase()}
                </span>
              </div>
              <p className="text-sm text-muted">{m.body}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted">{new Date(m.createdAt).toLocaleString()}</span>
                <span className="text-xs font-medium capitalize">{m.status.toLowerCase().replace('_', ' ')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CleanerMessages