import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { api, getApiError, uploadImage } from '../api';
import { useAuth } from '../AuthContext';
import {
  Button,
  C,
  Card,
  ChoiceRow,
  ErrorText,
  OsmMapModal,
  Page,
  PulseDot,
  ReportCard,
  SectionTitle,
  Stat,
  StatusPill,
  ui,
} from '../components/ui';
import type { CleanerMessage, Report } from '../types';
import { wasteLabel, wastePoints } from '../types';

async function getGps() {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (!perm.granted) throw new Error('Location is blocked. Allow location access in your phone settings.');
  const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
}

async function uploadPhoto(uri: string, fileName?: string, mimeType?: string) {
  return uploadImage(uri, fileName || 'after.jpg', mimeType || 'image/jpeg');
}

export function CleanerDashboardScreen({ navigation }: any) {
  const { auth } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const active = await api.get('/reports/active').catch(() => null);
      if (active?.data?.task) {
        navigation.getParent()?.navigate('ActiveTask');
        return;
      }
      const [r, c] = await Promise.all([api.get('/reports/team/mine'), api.get('/rewards/mine')]);
      setReports(r.data);
      setBalance(c.data.balance ?? 0);
      setError('');
    } catch (e) {
      setError(getApiError(e, 'Could not load cleaner dashboard.'));
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      void fetchData();
    }, [fetchData]),
  );

  const active = reports.filter((r) => ['ACCEPTED', 'IN_PROGRESS'].includes(r.status));
  const verify = reports.filter((r) => r.status === 'CLEANING_COMPLETED');
  const completed = reports.filter((r) => r.status === 'RESOLVED');

  return (
    <Page
      eyebrow="Cleaner Console"
      title={`Welcome, ${auth?.name?.split(' ')[0] ?? 'Crew'}`}
      subtitle="Live field dispatch & verified cleanup credits"
      refreshing={loading && !reports.length}
      onRefresh={() => void fetchData()}
    >
      <ErrorText>{error}</ErrorText>

      <Card dark style={{ padding: 18 }}>
        <View style={ui.rowBetween}>
          <View style={ui.row}>
            <PulseDot color="#34D399" />
            <Text style={cc.darkEyebrow}>CLEANER TELEMETRY · 5 KM RADAR</Text>
          </View>
          <Text style={{ color: '#34D399', fontSize: 12, fontWeight: '900' }}>{balance} PTS</Text>
        </View>
        <Text style={cc.darkHero}>Ready for nearby pickups.</Text>
        <View style={[ui.row, { marginTop: 14 }]}>
          <View style={{ flex: 1 }}>
            <Button title="⚡ Scan Nearby Requests" kind="accent" onPress={() => navigation.navigate('Urgent Requests')} />
          </View>
          {active.length ? (
            <Button compact title="Active Navigation →" kind="soft" onPress={() => navigation.getParent()?.navigate('ActiveTask')} />
          ) : null}
        </View>
      </Card>

      <View style={cc.statsWrap}>
        <Stat label="Active Jobs" value={active.length} icon="🛠️" onPress={() => navigation.navigate('My Tasks')} />
        <Stat label="In Review" value={verify.length} icon="⏳" onPress={() => navigation.navigate('My Tasks')} />
        <Stat label="Verified" value={completed.length} accent icon="✅" onPress={() => navigation.navigate('My Tasks')} />
        <Stat label="Credits" value={balance} accent icon="⭐" onPress={() => navigation.getParent()?.navigate('Credits')} />
      </View>

      <Card style={{ padding: 15 }}>
        <SectionTitle title="Assigned Queue" action="All tasks →" onAction={() => navigation.navigate('My Tasks')} />
        {active.length ? (
          <View style={{ gap: 12, marginTop: 8 }}>
            {active.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </View>
        ) : (
          <Text style={cc.empty}>No active task assigned. Open the Radar tab to claim a nearby request.</Text>
        )}
      </Card>
    </Page>
  );
}

export function CleanerTasksScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'completed'>('active');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [afterPhotos, setAfterPhotos] = useState<Record<string, { uri: string; name?: string; type?: string }>>({});

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/reports/team/mine');
      setReports(res.data);
      setError('');
    } catch (e) {
      setError(getApiError(e, 'Could not load tasks.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchData();
    }, [fetchData]),
  );

  const active = reports.filter((r) => ['ACCEPTED', 'IN_PROGRESS', 'CLEANING_COMPLETED'].includes(r.status));
  const completed = reports.filter((r) => r.status === 'RESOLVED');

  const chooseAfterPhoto = async (id: string) => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError('Allow camera access to take an after-cleaning photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true });
    if (result.canceled || !result.assets[0]) return;
    const a = result.assets[0];
    setAfterPhotos((prev) => ({
      ...prev,
      [id]: { uri: a.uri, name: a.fileName || 'after.jpg', type: a.mimeType || 'image/jpeg' },
    }));
    setError('');
  };

  const complete = async (report: Report) => {
    const photo = afterPhotos[report.id];
    if (!photo) {
      setError('Take an after-cleaning photo first.');
      return;
    }
    setBusy(report.id);
    setError('');
    try {
      const gps = await getGps();
      const uploaded = await uploadPhoto(photo.uri, photo.name, photo.type);
      await api.post(`/reports/${report.id}/complete`, {
        afterImageUrl: uploaded.url,
        latitude: gps.latitude,
        longitude: gps.longitude,
      });
      setAfterPhotos((prev) => {
        const copy = { ...prev };
        delete copy[report.id];
        return copy;
      });
      await fetchData();
      Alert.alert('Task Submitted ✅', 'Your cleanup photo is now awaiting admin verification.');
    } catch (e) {
      setError(getApiError(e, 'Could not complete. You must be within 150 m and at least 2 minutes after accepting.'));
    } finally {
      setBusy('');
    }
  };

  return (
    <Page
      eyebrow="Field Log"
      title="My Tasks"
      subtitle="Complete your active job at the spot to unlock new requests."
      refreshing={loading && reports.length === 0}
      onRefresh={() => void fetchData()}
    >
      <ErrorText>{error}</ErrorText>
      <ChoiceRow
        value={tab}
        options={[
          { value: 'active', label: `Active (${active.length})` },
          { value: 'completed', label: `Completed (${completed.length})` },
        ]}
        onChange={setTab}
      />
      {loading && !reports.length ? (
        <Text style={ui.body}>Loading tasks…</Text>
      ) : (tab === 'active' ? active : completed).length ? (
        (tab === 'active' ? active : completed).map((r) => {
          const photo = afterPhotos[r.id];
          return (
            <ReportCard
              key={r.id}
              report={r}
              footer={
                r.status === 'CLEANING_COMPLETED' ? (
                  <Text style={cc.info}>⏳ Submitted — awaiting admin verification (+{wastePoints(r.wasteType)} pts).</Text>
                ) : tab === 'active' ? (
                  <View style={{ gap: 8 }}>
                    <Text style={cc.hint}>Must be within 150 m of the pin and 2+ minutes after accepting.</Text>
                    {photo ? <Image source={{ uri: photo.uri }} style={cc.afterImage} /> : null}
                    <Button
                      compact
                      title={photo ? 'Retake After Photo' : '📷 Take After-Cleaning Photo'}
                      kind="secondary"
                      onPress={() => void chooseAfterPhoto(r.id)}
                    />
                    <Button
                      compact
                      kind="accent"
                      title={busy === r.id ? 'Verifying with AI…' : 'Mark Job Completed →'}
                      disabled={!photo || !!busy}
                      loading={busy === r.id}
                      onPress={() => void complete(r)}
                    />
                  </View>
                ) : null
              }
            />
          );
        })
      ) : (
        <Text style={cc.empty}>{tab === 'active' ? 'No active tasks right now.' : 'No completed pickups yet.'}</Text>
      )}
    </Page>
  );
}

export function UrgentRequestsScreen({ navigation }: any) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locMessage, setLocMessage] = useState('Syncing live GPS radar…');
  const [busyId, setBusyId] = useState('');
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [previewReport, setPreviewReport] = useState<Report | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      const res = await api.get('/reports/open');
      setReports(res.data);
      setError('');
    } catch (e) {
      setError(getApiError(e, 'Could not load nearby requests.'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen to live backend events so cleaners get notified instantly when a new report is created nearby
  useEffect(() => {
    const token = api.defaults.headers.common['Authorization']?.toString().replace('Bearer ', '');
    if (!token) return;
    const url = `${api.defaults.baseURL}/events?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(url); // or polling fetch fallback if EventSource polyfill isn't installed

    // Fallback polling interval if EventSource isn't native in mobile Hermes engine:
    const pollInterval = setInterval(() => {
      void fetchReports();
    }, 8000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [fetchReports]);
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      let subscription: Location.LocationSubscription | null = null;
      let poll: ReturnType<typeof setInterval> | undefined;
      (async () => {
        try {
          const active = await api.get('/reports/active').catch(() => null);
          if (!alive) return;
          if (active?.data?.task) {
            navigation.getParent()?.navigate('ActiveTask');
            return;
          }
          const permission = await Location.requestForegroundPermissionsAsync();
          if (!permission.granted) {
            if (alive) setLocMessage('Location is blocked. Allow GPS in phone settings.');
            return;
          }
          const first = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          if (!alive) return;
          const coords = { latitude: first.coords.latitude, longitude: first.coords.longitude };
          setPosition(coords);
          await api.patch('/reports/cleaner/location', coords);
          setLocMessage('LIVE RADAR ACTIVE · 5 KM RADIUS');
          await fetchReports();
          subscription = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 25 },
            async (loc) => {
              if (!alive) return;
              const next = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
              setPosition(next);
              try {
                await api.patch('/reports/cleaner/location', next);
                setLocMessage('LIVE RADAR ACTIVE · 5 KM RADIUS');
              } catch {
                setLocMessage('Reconnecting GPS telemetry…');
              }
            },
          );
          poll = setInterval(() => {
            void fetchReports();
          }, 5000);
        } catch (e) {
          if (alive) setLocMessage(getApiError(e, 'Turn on GPS location services.'));
        }
        
      })();
      return () => {
        alive = false;
        subscription?.remove();
        if (poll) clearInterval(poll);
      };
    }, [fetchReports, navigation]),
  );

  const accept = async (reportId: string) => {
    setBusyId(reportId);
    setError('');
    try {
      await api.post(`/reports/${reportId}/accept`);
      navigation.getParent()?.navigate('ActiveTask');
    } catch (e: any) {
      setError(
        getApiError(
          e,
          e?.response?.status === 409 ? 'Someone else just claimed that request.' : 'Could not accept. Try again.',
        ),
      );
      await fetchReports();
    } finally {
      setBusyId('');
    }
  };

  return (
    <Page
      eyebrow="Live Dispatch Radar"
      title="Nearby Requests"
      subtitle="Within 5 km of your live GPS. Claim a request to launch turn-by-turn navigation."
      refreshing={loading && reports.length === 0}
      onRefresh={() => void fetchReports()}
    >
      <Card dark style={{ padding: 14 }}>
        <View style={ui.rowBetween}>
          <View style={ui.row}>
            <PulseDot color="#34D399" />
            <Text style={cc.darkEyebrow}>{locMessage}</Text>
          </View>
          {position ? (
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontVariant: ['tabular-nums'] }}>
              {position.latitude.toFixed(4)}, {position.longitude.toFixed(4)}
            </Text>
          ) : null}
        </View>
      </Card>

      <ErrorText>{error}</ErrorText>

      {loading && !reports.length ? (
        <Text style={ui.body}>Scanning nearby streets…</Text>
      ) : reports.length ? (
        reports.map((r) => {
          const km = r.distanceKm ?? 0;
          const eta = Math.max(1, Math.round((km / 25) * 60));
          return (
            <Card key={r.id}>
              {r.images?.[0]?.url ? <Image source={{ uri: r.images[0].url }} style={cc.requestImage} /> : null}
              <View style={{ padding: 16 }}>
                <View style={ui.rowBetween}>
                  <Text style={cc.mono}>#{r.id.slice(0, 8).toUpperCase()}</Text>
                  <Text style={{ color: C.organic, fontWeight: '900', fontSize: 13 }}>INSTANT DISPATCH</Text>
                </View>
                <Text style={cc.cardTitle}>{wasteLabel(r.wasteType)}</Text>
                <Text style={ui.smallMuted}>{r.description.split(':')[0]}</Text>

                <View style={cc.distStats}>
                  <View style={cc.distStat}>
                    <Text style={cc.distValue}>{km.toFixed(1)} km</Text>
                    <Text style={cc.distLabel}>DISTANCE · ≈{eta} MIN</Text>
                  </View>
                  <View style={[cc.distStat, { backgroundColor: C.accentSoft, borderColor: C.accentSoft }]}>
                    <Text style={[cc.distValue, { color: C.accent }]}>+{wastePoints(r.wasteType)} PTS</Text>
                    <Text style={[cc.distLabel, { color: C.accent }]}>VERIFIED REWARD</Text>
                  </View>
                </View>

                <Button
                  kind="accent"
                  title={busyId === r.id ? 'Locking Request…' : 'Accept & Start Navigation →'}
                  loading={busyId === r.id}
                  disabled={!!busyId}
                  onPress={() => void accept(r.id)}
                />
                <View style={{ height: 8 }} />
                <Button
                  kind="secondary"
                  title="🗺️ Preview Route on OpenStreetMap"
                  compact
                  onPress={() => setPreviewReport(r)}
                />
              </View>
            </Card>
          );
        })
      ) : (
        <Text style={cc.empty}>No open waste requests within 5 km right now. Keep this radar open — it auto-refreshes.</Text>
      )}

      <OsmMapModal
        visible={!!previewReport}
        onClose={() => setPreviewReport(null)}
        dest={previewReport ? { latitude: previewReport.latitude, longitude: previewReport.longitude } : null}
        me={position}
        title={previewReport ? wasteLabel(previewReport.wasteType) : 'Request Spot'}
      />
    </Page>
  );
}

export function CleanerMessagesScreen() {
  const [messages, setMessages] = useState<CleanerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/messages/mine');
      setMessages(res.data);
      setError('');
    } catch (e) {
      setError(getApiError(e, 'Could not load messages.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchData();
    }, [fetchData]),
  );

  const update = async (message: CleanerMessage, status: CleanerMessage['status']) => {
    try {
      await api.patch(`/messages/${message.id}/status`, { status });
      await fetchData();
    } catch (e) {
      Alert.alert('Could not update message', getApiError(e));
    }
  };

  const nextStatus = (status: CleanerMessage['status']): CleanerMessage['status'] | null =>
    status === 'UNREAD' ? 'ACCEPTED' : status === 'ACCEPTED' ? 'IN_PROGRESS' : status === 'IN_PROGRESS' ? 'DONE' : null;

  return (
    <Page
      eyebrow="Admin Dispatch"
      title="Messages"
      subtitle="Direct priority instructions from platform administrators."
      refreshing={loading && !messages.length}
      onRefresh={() => void fetchData()}
    >
      <ErrorText>{error}</ErrorText>
      {loading && !messages.length ? (
        <Text style={ui.body}>Loading messages…</Text>
      ) : messages.length ? (
        messages.map((m) => (
          <Card key={m.id} style={{ padding: 16 }}>
            <View style={ui.rowBetween}>
              <Text style={cc.cardTitle}>📍 {m.location}</Text>
              <View style={[cc.priorityBadge, m.priority === 'URGENT' && { backgroundColor: C.redSoft }]}>
                <Text style={[cc.priority, m.priority === 'URGENT' && { color: C.red }]}>{m.priority}</Text>
              </View>
            </View>
            <Text style={[ui.body, { marginTop: 8 }]}>{m.body}</Text>
            <View style={[ui.rowBetween, { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.line }]}>
              <Text style={ui.smallMuted}>
                {new Date(m.createdAt).toLocaleDateString()} · {m.status.replace('_', ' ')}
              </Text>
              {nextStatus(m.status) ? (
                <Button
                  compact
                  kind="accent"
                  title={m.status === 'UNREAD' ? 'Accept Dispatch' : m.status === 'ACCEPTED' ? 'Start Work' : 'Mark Done ✓'}
                  onPress={() => void update(m, nextStatus(m.status)!)}
                />
              ) : null}
            </View>
          </Card>
        ))
      ) : (
        <Text style={cc.empty}>No dispatch messages from admin yet.</Text>
      )}
    </Page>
  );
}

const cc = StyleSheet.create({
  darkEyebrow: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  darkHero: { color: C.white, fontSize: 22, fontWeight: '900', marginTop: 8, letterSpacing: -0.5 },
  statsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  empty: { color: C.muted, textAlign: 'center', paddingVertical: 24, fontSize: 13 },
  cardTitle: { color: C.ink, fontSize: 16, fontWeight: '900', marginTop: 4 },
  mono: { color: C.muted, fontSize: 11, fontWeight: '700' },
  afterImage: { width: '100%', height: 180, borderRadius: 12, marginVertical: 8, backgroundColor: C.accentSoft },
  requestImage: { width: '100%', height: 170, backgroundColor: C.accentSoft },
  info: { color: C.accent, fontSize: 12, fontWeight: '700', lineHeight: 18 },
  hint: { color: C.muted, fontSize: 11, lineHeight: 17 },
  distStats: { flexDirection: 'row', gap: 10, marginVertical: 14 },
  distStat: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    backgroundColor: C.paper,
    alignItems: 'center',
    paddingVertical: 12,
  },
  distValue: { color: C.ink, fontSize: 20, fontWeight: '900' },
  distLabel: { color: C.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginTop: 4 },
  priorityBadge: {
    backgroundColor: C.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  priority: { color: C.muted, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
});