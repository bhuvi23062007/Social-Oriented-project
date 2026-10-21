import { useCallback, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, getApiError } from '../api';
import { Button, C, Card, ChoiceRow, ErrorText, Field, Page, ReportCard, SectionTitle, Stat, StatusPill, ui } from '../components/ui';
import type { Report, ReportStatus, Role } from '../types';
import { wasteLabel, wastePoints } from '../types';

interface Team { id: string; name: string; members: { id: string; name: string; email: string }[] }
interface User { id: string; name: string; email: string; role: Role; points: number; createdAt: string; cleaningTeamId?: string | null }

export function AdminOverviewScreen({ navigation }: any) {
  const [reports, setReports] = useState<Report[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetchData = useCallback(async () => {
    try { const [r, t] = await Promise.all([api.get('/reports'), api.get('/cleaning-teams')]); setReports(r.data); setTeams(t.data); setError(''); }
    catch (e) { setError(getApiError(e, 'Could not load admin overview.')); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void fetchData(); }, [fetchData]));
  const verificationQueue = reports.filter((r) => r.status === 'CLEANING_COMPLETED' || r.status === 'PENDING');
  const active = reports.filter((r) => r.status === 'IN_PROGRESS' || r.status === 'ACCEPTED');
  const completed = reports.filter((r) => r.status === 'RESOLVED');
  const statuses: ReportStatus[] = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'CLEANING_COMPLETED', 'RESOLVED', 'REJECTED'];
  return <Page eyebrow="Admin" title="Platform Overview" subtitle="Citywide activity across all users and cleaners." refreshing={loading && reports.length === 0} onRefresh={() => void fetchData()}>
    <ErrorText>{error}</ErrorText>
    <View style={ad.statsWrap}><Stat label="Total Reports" value={reports.length} /><Stat label="Pending Verification" value={verificationQueue.length} accent /><Stat label="Active Tasks" value={active.length} /><Stat label="Completed" value={completed.length} accent /></View>
    <Card style={{ padding: 14 }}><SectionTitle title="Pending Verification" action="Review all →" onAction={() => navigation.navigate('Verify Reports')} />
      {verificationQueue.length ? verificationQueue.slice(0, 4).map((r) => <View key={r.id} style={ad.simpleRow}><View style={{ flex: 1 }}><Text style={ad.mono}>#{r.id.slice(0, 8)}</Text><Text style={ad.rowTitle}>{r.description.split(':')[0]}</Text></View><StatusPill status={r.status} /></View>) : <Text style={ad.empty}>Nothing waiting right now.</Text>}
    </Card>
    <Card style={{ padding: 14 }}><SectionTitle title="Report Status Breakdown" />
      {statuses.map((status) => { const count = reports.filter((r) => r.status === status).length; const pct = reports.length ? Math.round(count / reports.length * 100) : 0; return <View key={status} style={{ marginTop: 13 }}><View style={ui.rowBetween}><Text style={ui.smallMuted}>{status.replace(/_/g, ' ')}</Text><Text style={ui.smallMuted}>{pct}% ({count})</Text></View><View style={ad.barBg}><View style={[ad.barFill, { width: `${pct}%` }]} /></View></View>; })}
    </Card>
    <Card style={{ padding: 14 }}><SectionTitle title="Cleaning Teams" action="Manage →" onAction={() => navigation.navigate('Cleaning Teams')} />
      {teams.length ? teams.map((t) => <View key={t.id} style={ad.simpleRow}><Text style={ad.rowTitle}>{t.name}</Text><Text style={ui.smallMuted}>{t.members?.length ?? 0} members</Text></View>) : <Text style={ad.empty}>No teams yet.</Text>}
    </Card>
  </Page>;
}

export function VerifyReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const fetchData = useCallback(async () => {
    try { const res = await api.get('/reports'); setReports(res.data); setError(''); }
    catch (e) { setError(getApiError(e, 'Could not load verification queue.')); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void fetchData(); }, [fetchData]));
  const act = async (id: string, status: 'RESOLVED' | 'REJECTED', note: string) => {
    setBusyId(id); setError('');
    try { await api.patch(`/reports/${id}/status`, { status, note }); await fetchData(); }
    catch (e) { setError(getApiError(e, 'Could not update this report.')); }
    finally { setBusyId(''); }
  };
  const queue = reports.filter((r) => r.status === 'CLEANING_COMPLETED');
  return <Page eyebrow="Verification" title="Verify Reports" subtitle="Approving here awards points to the citizen and the cleaner." refreshing={loading && reports.length === 0} onRefresh={() => void fetchData()}>
    <ErrorText>{error}</ErrorText>
    {loading && !reports.length ? <Text style={ui.body}>Loading reports…</Text> : queue.length ? queue.map((r) => {
      const before = r.images?.find((i) => i.type !== 'AFTER'); const after = r.images?.find((i) => i.type === 'AFTER');
      const cleaner = r.assignment?.cleaner?.name || r.assignment?.cleaningTeam?.name || '-';
      const aiNote = [...(r.statusHistory ?? [])].reverse().find((h) => h.status === 'CLEANING_COMPLETED')?.note;
      return <Card key={r.id} style={{ padding: 14 }}>
        <Text style={ad.mono}>#{r.id.slice(0, 8)}</Text><Text style={ad.rowTitle}>{wasteLabel(r.wasteType)}</Text><Text style={ui.body}>{r.description.split(':')[0]}</Text>
        <Text style={ui.smallMuted}>Reporter: {r.reporter?.name || r.reporter?.email || '-'} · Cleaner: {cleaner}</Text>
        {aiNote ? <Text style={ad.aiNote}>{aiNote}</Text> : null}
        <View style={ad.photoPair}>
          <View style={{ flex: 1 }}><Text style={ad.sectionLabel}>BEFORE</Text>{before?.url ? <Image source={{ uri: before.url }} style={ad.verifyImage} /> : <View style={ad.noImage}><Text style={ui.smallMuted}>No photo</Text></View>}</View>
          <View style={{ flex: 1 }}><Text style={ad.sectionLabel}>AFTER</Text>{after?.url ? <Image source={{ uri: after.url }} style={ad.verifyImage} /> : <View style={ad.noImage}><Text style={ui.smallMuted}>No photo</Text></View>}</View>
        </View>
        <Button title={busyId === r.id ? 'Approving…' : `Approve · +${wastePoints(r.wasteType)} each`} loading={busyId === r.id} disabled={!!busyId} onPress={() => void act(r.id, 'RESOLVED', 'Verified and resolved by admin')} />
        <View style={{ height: 8 }} /><Button title="Reject" kind="secondary" disabled={!!busyId} onPress={() => void act(r.id, 'REJECTED', 'Rejected by admin')} />
      </Card>;
    }) : <Text style={ad.empty}>Nothing waiting on verification right now.</Text>}
  </Page>;
}

export function AllReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const fetchData = useCallback(async () => {
    try { const [r, t] = await Promise.all([api.get('/reports'), api.get('/cleaning-teams')]); setReports(r.data); setTeams(t.data); setError(''); }
    catch (e) { setError(getApiError(e, 'Could not load reports.')); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void fetchData(); }, [fetchData]));
  const assign = async (id: string) => {
    const teamId = selected[id]; if (!teamId) return;
    setBusyId(id); setError('');
    try { await api.post(`/reports/${id}/assign`, { cleaningTeamId: teamId }); await fetchData(); }
    catch (e) { setError(getApiError(e, 'Could not assign team. Try again.')); }
    finally { setBusyId(''); }
  };
  return <Page eyebrow="Reports" title="All Reports" subtitle="Full history of every report submitted on the platform." refreshing={loading && !reports.length} onRefresh={() => void fetchData()}>
    <ErrorText>{error}</ErrorText>
    {loading && !reports.length ? <Text style={ui.body}>Loading reports…</Text> : reports.map((r) => {
      const teamName = r.assignment?.cleaningTeam?.name; const canAssign = !r.assignment && r.status === 'PENDING';
      return <Card key={r.id} style={{ padding: 14 }}>
        <View style={ui.rowBetween}><Text style={ad.mono}>#{r.id.slice(0, 8)}</Text><StatusPill status={r.status} /></View>
        <Text style={ad.rowTitle}>{r.description.split(':')[0]}</Text>
        <Text style={ui.smallMuted}>Reporter: {r.reporter?.name || r.reporter?.email || '-'}</Text>
        <Text style={ui.smallMuted}>Location: {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}</Text>
        <Text style={ui.smallMuted}>Date: {new Date(r.createdAt).toLocaleDateString()}</Text>
        <Text style={[ad.sectionLabel, { marginTop: 10 }]}>CLEANING TEAM</Text>
        {teamName ? <Text style={ad.rowTitle}>{teamName}</Text> : canAssign ? <>
          <View style={ad.teamChoices}>{teams.map((t) => <Pressable key={t.id} onPress={() => setSelected((old) => ({ ...old, [r.id]: t.id }))} style={[ad.teamChoice, selected[r.id] === t.id && ad.teamChoiceSelected]}><Text style={[ad.teamChoiceText, selected[r.id] === t.id && { color: C.white }]}>{t.name}</Text></Pressable>)}</View>
          <Button compact title={busyId === r.id ? 'Assigning…' : 'Assign Team'} disabled={!selected[r.id] || !!busyId} loading={busyId === r.id} onPress={() => void assign(r.id)} />
        </> : <Text style={ui.smallMuted}>—</Text>}
      </Card>;
    })}
  </Page>;
}

export function CleaningTeamsScreen() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teamName, setTeamName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fetchData = useCallback(async () => {
    try { const [t, u] = await Promise.all([api.get('/cleaning-teams'), api.get('/users')]); setTeams(t.data); setUsers(u.data); setError(''); }
    catch (e) { setError(getApiError(e, 'Could not load cleaning teams.')); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void fetchData(); }, [fetchData]));
  const assigned = new Set(teams.flatMap((t) => (t.members ?? []).map((m) => m.id)));
  const unassigned = users.filter((u) => u.role === 'CLEANING_STAFF' && !assigned.has(u.id));
  const createTeam = async () => {
    if (!teamName.trim()) return;
    setBusy(true); setError('');
    try { await api.post('/cleaning-teams', { name: teamName.trim() }); setTeamName(''); await fetchData(); }
    catch (e) { setError(getApiError(e, 'Could not create the team.')); }
    finally { setBusy(false); }
  };
  const assign = async (userId: string) => {
    const teamId = selectedTeam[userId]; if (!teamId) return;
    setBusy(true); setError('');
    try { await api.patch(`/users/${userId}/team`, { cleaningTeamId: teamId }); await fetchData(); }
    catch (e) { setError(getApiError(e, 'Could not assign cleaner.')); }
    finally { setBusy(false); }
  };
  return <Page eyebrow="Cleaners" title="Cleaning Teams" subtitle="Manage cleaning teams and their members." refreshing={loading && !teams.length} onRefresh={() => void fetchData()}>
    <ErrorText>{error}</ErrorText>
    <Card style={{ padding: 14 }}><Field label="New team name" value={teamName} onChangeText={setTeamName} placeholder="e.g. North Zone Team" /><Button title="Add Team" onPress={() => void createTeam()} disabled={!teamName.trim() || busy} loading={busy} /></Card>
    {unassigned.length ? <Card style={{ padding: 14 }}><SectionTitle title="Unassigned Cleaners" />
      {unassigned.map((u) => <View key={u.id} style={ad.assignmentRow}><View style={{ flex: 1 }}><Text style={ad.rowTitle}>{u.name}</Text><Text style={ui.smallMuted}>{u.email}</Text></View><View style={{ maxWidth: 145, gap: 5 }}>{teams.map((t) => <Pressable key={t.id} onPress={() => setSelectedTeam((old) => ({ ...old, [u.id]: t.id }))} style={[ad.teamChoice, selectedTeam[u.id] === t.id && ad.teamChoiceSelected]}><Text style={[ad.teamChoiceText, selectedTeam[u.id] === t.id && { color: C.white }]}>{t.name}</Text></Pressable>)}<Button compact title="Assign" disabled={!selectedTeam[u.id] || busy} onPress={() => void assign(u.id)} /></View></View>)}
    </Card> : null}
    {teams.length ? teams.map((t) => <Card key={t.id} style={{ padding: 14 }}><View style={ui.rowBetween}><Text style={ad.rowTitle}>{t.name}</Text><Text style={ui.smallMuted}>{t.members?.length ?? 0} members</Text></View>{t.members?.length ? t.members.map((m) => <Text key={m.id} style={ui.smallMuted}>{m.name}</Text>) : <Text style={ad.empty}>No members assigned yet.</Text>}</Card>) : <Text style={ad.empty}>No cleaning teams yet.</Text>}
  </Page>;
}

export function AdminUsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetchData = useCallback(async () => { try { const res = await api.get('/users'); setUsers(res.data); setError(''); } catch (e) { setError(getApiError(e, 'Could not load users.')); } finally { setLoading(false); } }, []);
  useFocusEffect(useCallback(() => { void fetchData(); }, [fetchData]));
  return <Page eyebrow="Users" title="Users" subtitle="Everyone registered on the platform." refreshing={loading && !users.length} onRefresh={() => void fetchData()}><ErrorText>{error}</ErrorText>
    {loading && !users.length ? <Text style={ui.body}>Loading users…</Text> : users.map((u) => <Card key={u.id} style={{ padding: 14 }}><Text style={ad.rowTitle}>{u.name}</Text><Text style={ui.smallMuted}>{u.email}</Text><View style={ad.userMeta}><Text style={ad.roleText}>{u.role.replace('_', ' ')}</Text><Text style={ad.pointsText}>{u.points} credits</Text></View><Text style={ui.smallMuted}>Joined {new Date(u.createdAt).toLocaleDateString()}</Text></Card>)}
  </Page>;
}

export function AdminMessagesScreen() {
  const [messages, setMessages] = useState<any[]>([]);
  const [cleaners, setCleaners] = useState<User[]>([]);
  const [cleanerId, setCleanerId] = useState('');
  const [location, setLocation] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<'URGENT' | 'NORMAL'>('URGENT');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fetchData = useCallback(async () => {
    try { const [m, u] = await Promise.all([api.get('/messages'), api.get('/users')]); const staff = (u.data as User[]).filter((x) => x.role === 'CLEANING_STAFF'); setMessages(m.data); setCleaners(staff); setCleanerId((current) => current || staff[0]?.id || ''); setError(''); }
    catch (e) { setError(getApiError(e, 'Could not load messages.')); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void fetchData(); }, [fetchData]));
  const send = async () => {
    if (!cleanerId || !location.trim() || !body.trim()) { setError('Choose a cleaner, location, and message.'); return; }
    setBusy(true); setError('');
    try { await api.post('/messages', { cleanerId, location: location.trim(), body: body.trim(), priority }); setLocation(''); setBody(''); await fetchData(); Alert.alert('Message sent', 'The cleaner has been notified.'); }
    catch (e) { setError(getApiError(e, 'Could not send message.')); }
    finally { setBusy(false); }
  };
  return <Page eyebrow="Messages" title="Messages" subtitle="Send urgent cleanup requests or updates directly to cleaners." refreshing={loading && !messages.length} onRefresh={() => void fetchData()}>
    <ErrorText>{error}</ErrorText>
    <Card style={{ padding: 14 }}><SectionTitle title="Send Task to Cleaner" />
      {cleaners.length ? <View style={ad.teamChoices}>{cleaners.map((c) => <Pressable key={c.id} onPress={() => setCleanerId(c.id)} style={[ad.teamChoice, cleanerId === c.id && ad.teamChoiceSelected]}><Text style={[ad.teamChoiceText, cleanerId === c.id && { color: C.white }]}>{c.name}</Text></Pressable>)}</View> : <Text style={ui.smallMuted}>No cleaning staff users found.</Text>}
      <Field label="Location" value={location} onChangeText={setLocation} placeholder="e.g. Nungambakkam High Rd" />
      <Field label="Message" value={body} onChangeText={setBody} placeholder="Urgent cleaning required in this area…" multiline />
      <ChoiceRow label="Priority" value={priority} options={[{ value: 'URGENT', label: 'Urgent' }, { value: 'NORMAL', label: 'Normal' }]} onChange={setPriority} />
      <Button title="Send to Cleaner" onPress={() => void send()} disabled={busy || !cleaners.length} loading={busy} />
    </Card>
    <Card style={{ padding: 14 }}><SectionTitle title="Sent Messages" />
      {messages.length ? messages.map((m) => <View key={m.id} style={ad.sentMessage}><Text style={ad.rowTitle}>{m.cleaner?.name ?? 'Unknown'} · {m.location}</Text><Text style={ui.smallMuted}>{m.body}</Text><View style={ui.rowBetween}><Text style={[ad.priority, m.priority === 'URGENT' && { color: C.red }]}>{m.priority}</Text><Text style={ui.smallMuted}>{String(m.status).toLowerCase().replace('_', ' ')}</Text></View></View>) : <Text style={ad.empty}>No messages sent yet.</Text>}
    </Card>
  </Page>;
}

const ad = StyleSheet.create({
  statsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  simpleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.line },
  rowTitle: { color: C.ink, fontSize: 13, fontWeight: '800', marginTop: 5 }, mono: { color: C.muted, fontSize: 11 }, empty: { color: C.muted, textAlign: 'center', paddingVertical: 20, fontSize: 12 },
  barBg: { height: 7, backgroundColor: C.white, borderRadius: 8, overflow: 'hidden', marginTop: 6 }, barFill: { height: 7, backgroundColor: C.accent, borderRadius: 8 },
  photoPair: { flexDirection: 'row', gap: 8, marginVertical: 13 }, sectionLabel: { color: C.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 6 }, verifyImage: { width: '100%', height: 112, borderRadius: 8, backgroundColor: C.accentSoft }, noImage: { height: 112, borderRadius: 8, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, justifyContent: 'center', alignItems: 'center' }, aiNote: { color: C.accent, fontSize: 11, marginTop: 9, lineHeight: 16 },
  teamChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 }, teamChoice: { paddingHorizontal: 10, paddingVertical: 8, backgroundColor: C.white, borderRadius: 8, borderWidth: 1, borderColor: C.line }, teamChoiceSelected: { backgroundColor: C.accent, borderColor: C.accent }, teamChoiceText: { color: C.ink, fontSize: 11, fontWeight: '600' },
  assignmentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line }, userMeta: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 9 }, roleText: { color: C.accent, fontSize: 10, fontWeight: '900' }, pointsText: { color: C.organic, fontSize: 12, fontWeight: '900' },
  priority: { color: C.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1 }, sentMessage: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line, gap: 5 },
});
