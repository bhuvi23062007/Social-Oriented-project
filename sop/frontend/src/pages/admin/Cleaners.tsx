import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

interface CleaningTeam {
  id: string
  name: string
  members: { id: string; name: string; email: string }[]
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

function Cleaners() {
  const [teams, setTeams] = useState<CleaningTeam[]>([])
  const [unassignedCleaners, setUnassignedCleaners] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')

  const fetchData = async () => {
    const [teamsRes, usersRes] = await Promise.all([
      api.get('/cleaning-teams'),
      api.get('/users'),
    ])
    const teamsData: CleaningTeam[] = teamsRes.data
    const assignedIds = new Set(teamsData.flatMap((t) => t.members.map((m) => m.id)))
    const cleaners = usersRes.data.filter((u: User) => u.role === 'CLEANING_STAFF' && !assignedIds.has(u.id))
    setTeams(teamsData)
    setUnassignedCleaners(cleaners)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return
    await api.post('/cleaning-teams', { name })
    setName('')
    fetchData()
  }

  const handleAssign = async (userId: string, teamId: string) => {
    await api.patch(`/users/${userId}/team`, { cleaningTeamId: teamId })
    fetchData()
  }

  if (loading) return <p className="text-muted text-sm">Loading...</p>

  return (
    <div>
      <div className="mb-8">
        <span className="label text-accent">Cleaners</span>
        <h1 className="text-3xl font-black tracking-tighter mt-1">Cleaning Teams</h1>
        <p className="text-muted text-sm mt-1">Manage cleaning teams and their members</p>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New team name"
          className="flex-1 border border-line rounded-md bg-paper px-3.5 py-2.5 text-sm focus:outline-none focus:border-accent"
        />
        <button type="submit" className="bg-ink text-paper px-5 py-2.5 rounded-md text-sm font-medium hover:bg-accent hover:text-white transition-colors">
          Add Team
        </button>
      </form>

      {unassignedCleaners.length > 0 && (
        <div className="bg-surface border border-line rounded-xl p-5 mb-6">
          <h3 className="text-sm font-bold mb-3">Unassigned Cleaners</h3>
          <div className="space-y-2">
            {unassignedCleaners.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <span>{c.name} <span className="text-muted">({c.email})</span></span>
                <select
                  onChange={(e) => e.target.value && handleAssign(c.id, e.target.value)}
                  defaultValue=""
                  className="border border-line rounded-md bg-paper px-2 py-1 text-xs focus:outline-none focus:border-accent"
                >
                  <option value="" disabled>Assign to team</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {teams.length === 0 ? (
          <p className="text-sm text-muted">No cleaning teams yet.</p>
        ) : (
          teams.map((t) => (
            <div key={t.id} className="bg-surface border border-line rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm">{t.name}</span>
                <span className="text-xs text-muted">{t.members.length} members</span>
              </div>
              {t.members.length === 0 ? (
                <p className="text-xs text-muted">No members assigned yet.</p>
              ) : (
                <div className="space-y-1.5 text-sm">
                  {t.members.map((m) => (
                    <div key={m.id} className="text-muted">{m.name}</div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Cleaners