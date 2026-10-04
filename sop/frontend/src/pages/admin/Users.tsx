import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

interface User {
  id: string
  name: string
  email: string
  role: string
  points: number
  createdAt: string
}

function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/users').then((res) => {
      setUsers(res.data)
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="text-muted text-sm">Loading...</p>

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
                <th className="px-4 py-3 label text-muted">Role</th>
                <th className="px-4 py-3 label text-muted">Credits</th>
                <th className="px-4 py-3 label text-muted">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0 hover:bg-paper transition-colors">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-muted">{u.email}</td>
                  <td className="px-4 py-3 text-muted">{u.role}</td>
                  <td className="px-4 py-3 font-mono text-accent">{u.points}</td>
                  <td className="px-4 py-3 text-muted text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
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