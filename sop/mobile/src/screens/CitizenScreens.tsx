import { useCallback, useState } from 'react';
import {
  Alert, Image, Linking, Pressable, StyleSheet, Text, View,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { api, getApiError, uploadImage } from '../api';
import { useAuth } from '../AuthContext';
import { Button, C, Card, ErrorText, Field, Page, ReportCard, SectionTitle, Stat, ui } from '../components/ui';
import type { AppNotification, CreditEvent, Report } from '../types';

const defaultRegion: Region = { latitude: 20.5937, longitude: 78.9629, latitudeDelta: 15, longitudeDelta: 15 };
type LatLng = { latitude: number; longitude: number };

async function reverseAddress(coords: LatLng) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&lat=${coords.latitude}&lon=${coords.longitude}`);
    const data = await response.json();
    const a = data.address || {};
    const parts = [a.road || a.neighbourhood, a.suburb, a.city || a.town || a.village || a.county].filter(Boolean);
    return parts.length ? parts.join(', ') : String(data.display_name || '').split(',').slice(0, 3).join(',').trim();
  } catch { return ''; }
}

async function geocodeAddress(query: string): Promise<LatLng | null> {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`);
  const data = await response.json();
  if (!Array.isArray(data) || !data.length) return null;
  return { latitude: Number(data[0].lat), longitude: Number(data[0].lon) };
}

async function currentLocation(): Promise<LatLng> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) throw new Error('Allow location access to use GPS.');
  const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
}

function PhotoControls({ imageUri, onPick }: { imageUri: string | null; onPick: (camera: boolean) => void }) {
  return (
    <Card style={{ padding: 14 }}>
      {imageUri ? <Image source={{ uri: imageUri }} style={{ width: '100%', height: 180, borderRadius: 10, marginBottom: 10 }} resizeMode="cover" /> : <View style={cs.photoPlaceholder}><Text style={{ fontSize: 30 }}>📷</Text><Text style={cs.photoPlaceholderText}>Photo of the waste is required</Text></View>}
      <View style={ui.row}>
        <View style={{ flex: 1 }}><Button compact title="Take photo" onPress={() => onPick(true)} /></View>
        <View style={{ flex: 1 }}><Button compact title="Choose photo" kind="secondary" onPress={() => onPick(false)} /></View>
      </View>
    </Card>
  );
}

export function CitizenDashboardScreen({ navigation }: any) {
  const { auth } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [balance, setBalance] = useState(0);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [r, c, n] = await Promise.all([api.get('/reports/mine'), api.get('/rewards/mine'), api.get('/notifications/mine')]);
      setReports(r.data); setBalance(c.data.balance ?? 0); setUnread((n.data as AppNotification[]).filter((x) => !x.read).length); setError('');
    } catch (e) { setError(getApiError(e, 'Could not load the dashboard.')); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { void fetchData(); }, [fetchData]));
  const pending = reports.filter((r) => ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'CLEANING_COMPLETED'].includes(r.status)).length;
  const resolved = reports.filter((r) => r.status === 'RESOLVED').length;
  return (
    <Page eyebrow="Dashboard" title={`Welcome, ${auth?.name?.split(' ')[0] ?? 'there'}!`} subtitle="Here's what's happening with your reports" refreshing={refreshing || (loading && !reports.length)} onRefresh={() => { setRefreshing(true); void fetchData(true); }}>
      <ErrorText>{error}</ErrorText>
      {loading && reports.length === 0 ? <Text style={ui.body}>Loading dashboard…</Text> : <>
        <Button title="＋ Report Waste" onPress={() => navigation.navigate('Report Waste')} />
        <View style={cs.statsWrap}>
          <Stat label="Total Reports" value={reports.length} />
          <Stat label="Resolved" value={resolved} accent />
          <Stat label="Pending" value={pending} />
          <Stat label="Credits" value={balance} accent />
        </View>
        <Card style={{ padding: 15 }}>
          <SectionTitle title="Recent Reports" action="View all →" onAction={() => navigation.navigate('My Reports')} />
          {reports.length ? reports.slice(0, 4).map((report) => <ReportCard key={report.id} report={report} />) : <Text style={cs.empty}>No reports yet.</Text>}
        </Card>
        <Card style={{ padding: 15 }}>
          <SectionTitle title="Notifications" action="View all →" onAction={() => navigation.navigate('Notifications')} />
          <Text style={ui.body}>{unread} unread notification(s)</Text>
          <View style={cs.rule} />
          <Text style={cs.cardHeading}>Your Credits</Text>
          <Text style={cs.creditValue}>{balance}</Text>
          <Text style={ui.smallMuted}>Earned from resolved reports</Text>
        </Card>
      </>}
    </Page>
  );
}

export function ReportWasteScreen({ navigation }: any) {
  const [locationText, setLocationText] = useState('');
  const [description, setDescription] = useState('');
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [region, setRegion] = useState<Region>(defaultRegion);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState('photo.jpg');
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [locationBusy, setLocationBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [locationMessage, setLocationMessage] = useState('Use GPS, enter an address, or drag the map marker to the exact spot.');

  const updateCoords = async (next: LatLng, lookupName = false) => {
    setCoords(next);
    setRegion({ ...next, latitudeDelta: 0.012, longitudeDelta: 0.012 });
    if (lookupName) {
      const name = await reverseAddress(next);
      if (name) setLocationText(name);
    }
  };
  const detect = async () => {
    setLocationBusy(true); setLocationMessage('Getting your GPS location…'); setError('');
    try { await updateCoords(await currentLocation(), true); setLocationMessage('GPS location detected. Drag the marker to adjust it.'); }
    catch (e: any) { setError(e?.message || 'Could not get GPS. Allow location access, or enter an address.'); }
    finally { setLocationBusy(false); }
  };
  const findAddress = async () => {
    if (!locationText.trim()) { setError('Enter an address first.'); return; }
    setLocationBusy(true); setError('');
    try {
      const found = await geocodeAddress(locationText.trim());
      if (!found) { setError('Address not found. Try a more specific one.'); return; }
      await updateCoords(found); setLocationMessage('Address found. Drag the marker if you need to adjust it.');
    } catch (e) { setError(getApiError(e, 'Address lookup failed. Try again.')); }
    finally { setLocationBusy(false); }
  };
  const pickImage = async (camera: boolean) => {
    try {
      if (camera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) { setError('Camera permission is required to take a photo.'); return; }
      }
      const result = camera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      setImageUri(asset.uri); setFileName(asset.fileName || 'photo.jpg'); setMimeType(asset.mimeType || 'image/jpeg'); setError('');
    } catch (e) { setError(getApiError(e, 'Could not open the photo picker.')); }
  };
  const submit = async () => {
    setError('');
    if (!imageUri) { setError('A photo of the waste is required'); return; }
    if (!coords) { setError('Pick a spot: allow GPS, find an address, or move the map marker.'); return; }
    if (!description.trim()) { setError('Describe the waste problem.'); return; }
    setSubmitting(true);
    try {
      const upload = await uploadImage(imageUri, fileName, mimeType);
      await api.post('/reports', {
        description: `${locationText.trim()}: ${description.trim()}`,
        latitude: coords.latitude,
        longitude: coords.longitude,
        imageUrl: upload.url,
      });
      Alert.alert('Report submitted', 'Your report has been submitted for review.');
      navigation.navigate('My Reports');
    } catch (e) { setError(getApiError(e, 'Failed to submit report.')); }
    finally { setSubmitting(false); }
  };

  return (
    <Page eyebrow="Report" title="Report Waste" subtitle="Move the map marker to put the pin exactly on the spot.">
      <Card style={{ overflow: 'hidden' }}>
        <MapView style={{ height: 220, width: '100%' }} region={region}
          onRegionChangeComplete={(r) => { setRegion(r); if (coords) setCoords({ latitude: r.latitude, longitude: r.longitude }); }}
          onPress={(e) => { const c = e.nativeEvent.coordinate; void updateCoords(c); }}>
          {coords ? <Marker draggable coordinate={coords} onDragEnd={(e) => { void updateCoords(e.nativeEvent.coordinate, true); }} /> : null}
        </MapView>
        <View style={{ padding: 12, gap: 9 }}>
          <Text style={ui.smallMuted}>{locationMessage}</Text>
          {coords ? <Text style={cs.coords}>{coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}</Text> : <Text style={ui.smallMuted}>No location selected yet.</Text>}
          <View style={ui.row}>
            <View style={{ flex: 1 }}><Button title="◎ Detect GPS" compact onPress={() => void detect()} loading={locationBusy} /></View>
            <View style={{ flex: 1 }}><Button title="Find address" kind="secondary" compact onPress={() => void findAddress()} loading={locationBusy} /></View>
          </View>
        </View>
      </Card>
      <Field label="Location / landmark" value={locationText} onChangeText={setLocationText} placeholder="Street name or landmark" />
      <Field label="Description" value={description} onChangeText={setDescription} placeholder="Describe the waste problem…" multiline />
      <Text style={cs.sectionLabel}>PHOTO (REQUIRED)</Text>
      <PhotoControls imageUri={imageUri} onPick={pickImage} />
      <Text style={ui.smallMuted}>The backend checks the uploaded photo and classifies the waste type.</Text>
      <ErrorText>{error}</ErrorText>
      <Button title={submitting ? 'Analyzing photo…' : 'Submit Report'} onPress={() => void submit()} loading={submitting} disabled={submitting} />
    </Page>
  );
}

export function MyReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const fetchData = useCallback(async () => {
    try { const res = await api.get('/reports/mine'); setReports(res.data); setError(''); }
    catch (e) { setError(getApiError(e, 'Could not load your reports.')); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { void fetchData(); }, [fetchData]));
  return (
    <Page eyebrow="History" title="My Reports" subtitle="Track the progress of each report you have submitted." refreshing={refreshing} onRefresh={() => { setRefreshing(true); void fetchData(); }}>
      <ErrorText>{error}</ErrorText>
      {loading && !reports.length ? <Text style={ui.body}>Loading reports…</Text> : reports.length ? reports.map((r) => <ReportCard key={r.id} report={r} />) : <Text style={cs.empty}>No reports submitted yet.</Text>}
    </Page>
  );
}

export function CreditsScreen({ cleaner = false }: { cleaner?: boolean }) {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<CreditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetchData = useCallback(async () => {
    try { const res = await api.get('/rewards/mine'); setBalance(res.data.balance ?? 0); setHistory(res.data.history ?? []); setError(''); }
    catch (e) { setError(getApiError(e, 'Could not load credits.')); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void fetchData(); }, [fetchData]));
  return (
    <Page eyebrow={cleaner ? 'Cleaner' : 'Citizen'} title="Credits & Rewards" subtitle={cleaner ? 'Track your verified collection credits and rewards.' : 'Track your earned credits from resolved reports.'}>
      <ErrorText>{error}</ErrorText>
      <View style={cs.statsWrap}><Stat label="Total Credits" value={loading ? '…' : balance} accent /><Stat label={cleaner ? 'Verified Activities' : 'Credit Transactions'} value={history.length} /><Stat label="Per report" value="Variable" /></View>
      <Card style={{ padding: 15 }}>
        <SectionTitle title="Credit History" />
        {!history.length ? <Text style={cs.empty}>No credit history yet.</Text> : history.map((h) => (
          <View key={h.id} style={cs.historyRow}>
            <View style={{ flex: 1 }}><Text style={cs.cardHeading}>{h.reason}</Text><Text style={ui.smallMuted}>{new Date(h.createdAt).toLocaleDateString()}</Text></View>
            <Text style={[cs.points, { color: h.points < 0 ? C.red : C.organic }]}>{h.points > 0 ? '+' : ''}{h.points}</Text>
          </View>
        ))}
      </Card>
      <Card style={{ padding: 15 }}><SectionTitle title="How You Earn Credits" /><Text style={ui.body}>Credits are added automatically when an admin resolves a report. The credit amount depends on the waste type; cleaners receive credits when a completed job is verified.</Text></Card>
    </Page>
  );
}

export function NotificationsScreen() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetchData = useCallback(async () => {
    try { const res = await api.get('/notifications/mine'); setItems(res.data); setError(''); }
    catch (e) { setError(getApiError(e, 'Could not load notifications.')); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void fetchData(); }, [fetchData]));
  const markRead = async (id: string) => {
    try { await api.patch(`/notifications/${id}/read`); setItems((old) => old.map((n) => n.id === id ? { ...n, read: true } : n)); }
    catch (e) { Alert.alert('Could not update', getApiError(e)); }
  };
  return (
    <Page eyebrow="Updates" title="Notifications" subtitle="Tap a notification to mark it as read.">
      <ErrorText>{error}</ErrorText>
      {loading && !items.length ? <Text style={ui.body}>Loading notifications…</Text> : items.length ? items.map((n) => (
        <Pressable key={n.id} onPress={() => void markRead(n.id)} style={[cs.notification, !n.read && cs.notificationUnread]}>
          <View style={ui.rowBetween}><Text style={cs.cardHeading}>{n.message}</Text>{!n.read ? <View style={cs.unreadDot} /> : null}</View>
          <Text style={ui.smallMuted}>{new Date(n.createdAt).toLocaleString()}</Text>
        </Pressable>
      )) : <Text style={cs.empty}>No notifications yet.</Text>}
    </Page>
  );
}

export function RewardsScreen() {
  const [balance, setBalance] = useState(0);
  const [catalog, setCatalog] = useState<{ id: string; title: string; cost: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fetchData = useCallback(async () => {
    try { const [r, c] = await Promise.all([api.get('/rewards/mine'), api.get('/rewards/catalog')]); setBalance(r.data.balance ?? 0); setCatalog(c.data); setError(''); }
    catch (e) { setError(getApiError(e, 'Could not load rewards.')); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void fetchData(); }, [fetchData]));
  const redeem = async (id: string) => {
    setBusyId(id); setMessage(''); setError('');
    try { const res = await api.post('/rewards/redeem', { rewardId: id }); setMessage(`Redeemed ${res.data.redeemed}!`); await fetchData(); }
    catch (e) { setError(getApiError(e, 'Redeem failed. Try again.')); }
    finally { setBusyId(''); }
  };
  const iconFor = (id: string) => id === 'plant' ? '🌱' : id === 'bag' ? '🛍️' : '🎁';
  return (
    <Page eyebrow="Rewards" title="Rewards" subtitle="Earn points by helping keep your community clean.">
      <View style={cs.rewardHero}><Text style={{ fontSize: 30 }}>🏆</Text><Text style={cs.rewardHeroLabel}>AVAILABLE POINTS</Text><Text style={cs.rewardHeroValue}>{loading ? '…' : `${balance} Points`}</Text><Text style={{ color: '#DCE6FF', fontSize: 12 }}>Keep reporting waste to earn more points!</Text></View>
      <Card style={{ padding: 15 }}><SectionTitle title="How to Earn Points" />
        <View style={cs.historyRow}><Text style={{ fontSize: 22 }}>📸</Text><View style={{ flex: 1 }}><Text style={cs.cardHeading}>Report Waste</Text><Text style={ui.smallMuted}>Submit a valid waste report.</Text></View><Text style={cs.points}>+0</Text></View>
        <View style={cs.historyRow}><Text style={{ fontSize: 22 }}>✅</Text><View style={{ flex: 1 }}><Text style={cs.cardHeading}>Report Resolved</Text><Text style={ui.smallMuted}>Your report gets resolved by admin.</Text></View><Text style={cs.points}>+10+</Text></View>
      </Card>
      <ErrorText>{error}</ErrorText>{message ? <Text style={{ color: C.organic, fontWeight: '700' }}>{message}</Text> : null}
      <SectionTitle title="Available Rewards" />
      {catalog.map((item) => <Card key={item.id} style={{ padding: 15 }}>
        <View style={ui.rowBetween}><Text style={{ fontSize: 30 }}>{iconFor(item.id)}</Text><Text style={cs.points}>{item.cost} Points</Text></View>
        <Text style={[cs.cardHeading, { marginTop: 10 }]}>{item.title}</Text>
        <Text style={[ui.smallMuted, { marginTop: 5 }]}>{item.id === 'plant' ? 'Get a small plant for your home.' : item.id === 'bag' ? 'Reusable shopping bag for daily use.' : 'Special reward for active contributors.'}</Text>
        <View style={{ marginTop: 12 }}><Button title={busyId === item.id ? 'Redeeming…' : 'Redeem'} onPress={() => void redeem(item.id)} disabled={busyId === item.id || balance < item.cost} /></View>
      </Card>)}
    </Page>
  );
}

const videos = [
  { title: 'Waste Segregation Basics', category: 'Basics', youtubeId: 'JlbbVGPATgA' },
  { title: 'Composting at Home', category: 'Organic', youtubeId: 'mDIVpJgjoXQ' },
  { title: 'Recycling Plastics Correctly', category: 'Recycling', youtubeId: 'cNPEH0GOhRw' },
  { title: 'E-Waste: What to Do', category: 'Hazardous', youtubeId: 'w0ikFMTuS9c' },
  { title: 'Reducing Household Waste', category: 'Basics', youtubeId: 'EGzg77rx7Uo' },
];
export function LearningScreen() {
  return <Page eyebrow="Learn" title="Learn" subtitle="Short videos on waste management, sorted for you.">
    {videos.map((v) => <Pressable key={v.youtubeId} onPress={() => void Linking.openURL(`https://www.youtube.com/watch?v=${v.youtubeId}`)} style={cs.learningRow}>
      <Image source={{ uri: `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg` }} style={cs.learningImage} />
      <View style={{ flex: 1 }}><Text style={cs.eyebrowSmall}>{v.category}</Text><Text style={cs.cardHeading}>{v.title}</Text><Text style={ui.smallMuted}>▶ Watch video</Text></View>
    </Pressable>)}
  </Page>;
}

const cs = StyleSheet.create({
  statsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  empty: { color: C.muted, textAlign: 'center', paddingVertical: 24, fontSize: 13 },
  rule: { height: 1, backgroundColor: C.line, marginVertical: 15 },
  cardHeading: { color: C.ink, fontSize: 14, fontWeight: '800' },
  creditValue: { color: C.accent, fontWeight: '900', fontSize: 28, marginTop: 3 },
  coords: { color: C.muted, fontSize: 11, fontVariant: ['tabular-nums'] },
  sectionLabel: { color: C.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  photoPlaceholder: { borderWidth: 1, borderColor: C.line, borderStyle: 'dashed', borderRadius: 10, minHeight: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 12, gap: 7 },
  photoPlaceholderText: { color: C.muted, fontSize: 12 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.line },
  points: { color: C.organic, fontSize: 14, fontWeight: '900' },
  notification: { borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, padding: 14, borderRadius: 12, gap: 7 },
  notificationUnread: { borderColor: C.accent, borderWidth: 1.5 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent },
  rewardHero: { backgroundColor: C.accent, borderRadius: 18, padding: 22, gap: 7 },
  rewardHeroLabel: { color: '#DCE6FF', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  rewardHeroValue: { color: C.white, fontSize: 28, fontWeight: '900' },
  learningRow: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 13, marginBottom: 10 },
  learningImage: { width: 105, height: 75, borderRadius: 9, backgroundColor: C.accentSoft },
  eyebrowSmall: { color: C.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginBottom: 5, textTransform: 'uppercase' },
});
