const cleanerRoster = [
  { name: 'Karthik Raj', status: 'active', rating: 4.8, tasksToday: 3, lifetime: 62 },
  { name: 'Arjun Dev', status: 'active', rating: 4.6, tasksToday: 2, lifetime: 44 },
  { name: 'Meena Iyer', status: 'offline', rating: 4.9, tasksToday: 0, lifetime: 28 },
]

function Cleaners() {
  return (
    <div>
      <div className="mb-8">
        <span className="label text-accent">Cleaners</span>
        <h1 className="text-3xl font-black tracking-tighter mt-1">Cleaner Roster</h1>
        <p className="text-muted text-sm mt-1">Monitor activity and performance across your cleaning team</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {cleanerRoster.map((c) => (
          <div key={c.name} className="bg-surface border border-line rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm">{c.name}</span>
              <span className={`w-2 h-2 rounded-full ${c.status === 'active' ? 'bg-organic' : 'bg-muted'}`} />
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted"><span>Rating</span><span className="text-ink font-medium">⭐ {c.rating}</span></div>
              <div className="flex justify-between text-muted"><span>Tasks today</span><span className="text-ink font-medium">{c.tasksToday}</span></div>
              <div className="flex justify-between text-muted"><span>Lifetime tasks</span><span className="text-ink font-medium">{c.lifetime}</span></div>
              <div className="flex justify-between text-muted"><span>Status</span><span className="text-ink font-medium capitalize">{c.status}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Cleaners
