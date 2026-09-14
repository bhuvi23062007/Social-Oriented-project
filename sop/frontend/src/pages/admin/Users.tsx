const users = [
  { name: 'Priya Sharma', email: 'priya@cleancity.com', points: 420, reports: 18, joined: 'Mar 2026' },
  { name: 'Ravi Kumar', email: 'ravi@cleancity.com', points: 320, reports: 9, joined: 'May 2026' },
  { name: 'Sneha Pillai', email: 'sneha@cleancity.com', points: 1150, reports: 31, joined: 'Jan 2026' },
]

function Users() {
  return (
    <div>
      <div className="mb-8">
        <span className="label text-accent">Users</span>
        <h1 className="text-3xl font-black tracking-tighter mt-1">Users</h1>
        <p className="text-muted text-sm mt-1">Everyone registered on the platform</p>
      </div>

      <div className="bg-surface border border-line rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="px-4 py-3 label text-muted">Name</th>
                <th className="px-4 py-3 label text-muted">Email</th>
                <th className="px-4 py-3 label text-muted">Reports</th>
                <th className="px-4 py-3 label text-muted">Credits</th>
                <th className="px-4 py-3 label text-muted">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.email} className="border-b border-line last:border-0 hover:bg-paper transition-colors">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-muted">{u.email}</td>
                  <td className="px-4 py-3 text-muted">{u.reports}</td>
                  <td className="px-4 py-3 font-mono text-accent">{u.points}</td>
                  <td className="px-4 py-3 text-muted text-xs">{u.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Users