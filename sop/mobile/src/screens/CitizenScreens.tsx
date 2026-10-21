import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
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
  Field,
  Page,
  PulseDot,
  ReportCard,
  SectionTitle,
  Stat,
  ui,
} from '../components/ui';
import type { AppNotification, CreditEvent, Report } from '../types';
import { WASTE_OPTIONS } from '../types';

type LatLng = { latitude: number; longitude: number };

function getTier(points: number) {
  if (points >= 250) return { name: 'Zero-Waste Champion', icon: '👑', next: 500, min: 250 };
  if (points >= 100) return { name: 'Green Guardian', icon: '🛡️', next: 250, min: 100 };
  return { name: 'Eco Scout', icon: '🌱', next: 100, min: 0 };
}

async function reverseAddress(coords: LatLng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&lat=${coords.latitude}&lon=${coords.longitude}`,
      { headers: { 'User-Agent': 'CleanMaxxMobile/1.0' } },
    );
    const data = await response.json();
    const a = data.address || {};
    const parts = [a.road || a.neighbourhood, a.suburb, a.city || a.town || a.village || a.county].filter(Boolean);
    return parts.length ? parts.join(', ') : String(data.display_name || '').split(',').slice(0, 3).join(',').trim();
  } catch {
    return '';
  }
}

async function geocodeAddress(query: string): Promise<LatLng | null> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
    { headers: { 'User-Agent': 'CleanMaxxMobile/1.0' } },
  );
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
      const [r, c, n] = await Promise.all([
        api.get('/reports/mine'),
        api.get('/rewards/mine'),
        api.get('/notifications/mine'),
      ]);
      setReports(r.data);
      setBalance(c.data.balance ?? 0);
      setUnread((n.data as AppNotification[]).filter((x) => !x.read).length);
      setError('');
    } catch (e) {
      setError(getApiError(e, 'Could not load the dashboard.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchData();
    }, [fetchData]),
  );

  const pending = reports.filter((r) =>
    ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'CLEANING_COMPLETED'].includes(r.status),
  ).length;
  const resolved = reports.filter((r) => r.status === 'RESOLVED').length;
  const tier = getTier(balance);
  const progressPct = Math.min(100, Math.round(((balance - tier.min) / (tier.next - tier.min)) * 100));

  return (
    <Page
      eyebrow="Citizen Console"
      title={`Hi, ${auth?.name?.split(' ')[0] ?? 'Citizen'}`}
      subtitle="Real-time waste telemetry & community rewards"
      rightAction={
        <Pressable onPress={() => navigation.navigate('Notifications')} style={cs.bellBtn}>
          <Text style={{ fontSize: 17 }}>🔔</Text>
          {unread > 0 ? (
            <View style={cs.bellBadge}>
              <Text style={cs.bellBadgeText}>{unread}</Text>
            </View>
          ) : null}
        </Pressable>
      }
      refreshing={refreshing || (loading && !reports.length)}
      onRefresh={() => {
        setRefreshing(true);
        void fetchData(true);
      }}
    >
      <ErrorText>{error}</ErrorText>

      <Card dark style={cs.heroWallet}>
        <View style={ui.rowBetween}>
          <View style={ui.row}>
            <PulseDot color="#34D399" />
            <Text style={cs.heroEyebrow}>CLEANMAXX CREDITS WALLET</Text>
          </View>
          <View style={cs.tierPill}>
            <Text style={cs.tierPillText}>
              {tier.icon} {tier.name}
            </Text>
          </View>
        </View>

        <View style={[ui.rowBetween, { marginTop: 14, alignItems: 'flex-end' }]}>
          <View>
            <Text style={cs.heroBalance}>{balance.toLocaleString()}</Text>
            <Text style={cs.heroSub}>Available points for eco-redemption</Text>
          </View>
          <Button compact kind="accent" title="Redeem →" onPress={() => navigation.navigate('Rewards')} />
        </View>

        <View style={cs.progressTrack}>
          <View style={[cs.progressFill, { width: `${progressPct}%` }]} />
        </View>
        <View style={[ui.rowBetween, { marginTop: 6 }]}>
          <Text style={cs.heroProgressText}>{balance} pts</Text>
          <Text style={cs.heroProgressText}>Next tier at {tier.next} pts</Text>
        </View>
      </Card>

      <Button title="＋ Snap & Report Waste" icon="📸" onPress={() => navigation.navigate('Report Waste')} />

      <View style={cs.statsWrap}>
        <Stat label="Total Reports" value={reports.length} icon="📋" onPress={() => navigation.navigate('My Reports')} />
        <Stat label="Resolved" value={resolved} accent icon="✅" onPress={() => navigation.navigate('My Reports')} />
        <Stat label="In Progress" value={pending} icon="⏳" onPress={() => navigation.navigate('My Reports')} />
        <Stat label="Wallet" value={`${balance} pts`} accent icon="⭐" onPress={() => navigation.navigate('Credits')} />
      </View>

      <Card style={{ padding: 15 }}>
        <SectionTitle title="Recent Activity" action="See all →" onAction={() => navigation.navigate('My Reports')} />
        {reports.length ? (
          <View style={{ gap: 12, marginTop: 8 }}>
            {reports.slice(0, 3).map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </View>
        ) : (
          <Text style={cs.empty}>No waste reports filed yet. Tap above to submit your first report!</Text>
        )}
      </Card>
    </Page>
  );
}

export function ReportWasteScreen({ navigation }: any) {
  const webViewRef = useRef<WebView>(null);
  const [mode, setMode] = useState<'gps' | 'manual'>('gps');
  const [locationText, setLocationText] = useState('');
  const [description, setDescription] = useState('');
  const [coords, setCoords] = useState<LatLng>({ latitude: 13.0827, longitude: 80.2707 });
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState('photo.jpg');
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [locationBusy, setLocationBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [placeLabel, setPlaceLabel] = useState('Move map to position pin');

  const updatePosition = async (lat: number, lng: number) => {
    const next = { latitude: lat, longitude: lng };
    setCoords(next);
    const name = await reverseAddress(next);
    if (name) {
      setPlaceLabel(name);
      if (mode === 'gps') setLocationText(name);
    }
  };

  const detect = async () => {
    setLocationBusy(true);
    setError('');
    try {
      const gps = await currentLocation();
      setCoords(gps);
      webViewRef.current?.injectJavaScript(`map.setView([${gps.latitude}, ${gps.longitude}], 17); true;`);
      const name = await reverseAddress(gps);
      if (name) {
        setPlaceLabel(name);
        setLocationText(name);
      }
    } catch (e: any) {
      setError(e?.message || 'Could not get GPS.');
    } finally {
      setLocationBusy(false);
    }
  };

  const findAddress = async () => {
    if (!locationText.trim()) return;
    setLocationBusy(true);
    setError('');
    try {
      const found = await geocodeAddress(locationText.trim());
      if (!found) {
        setError('Address not found.');
        return;
      }
      setCoords(found);
      setPlaceLabel(locationText.trim());
      webViewRef.current?.injectJavaScript(`map.setView([${found.latitude}, ${found.longitude}], 17); true;`);
    } catch (e) {
      setError(getApiError(e, 'Address lookup failed.'));
    } finally {
      setLocationBusy(false);
    }
  };

  const pickImage = async (camera: boolean) => {
    try {
      if (camera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          setError('Camera permission required.');
          return;
        }
      }
      const res = camera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true });
      if (res.canceled || !res.assets[0]) return;
      const asset = res.assets[0];
      setImageUri(asset.uri);
      setFileName(asset.fileName || 'photo.jpg');
      setMimeType(asset.mimeType || 'image/jpeg');
      setError('');
    } catch {
      setError('Could not pick photo.');
    }
  };

  const submit = async () => {
    setError('');
    if (!imageUri) {
      setError('Photo is required.');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }
    setSubmitting(true);
    try {
      const upload = await uploadImage(imageUri, fileName, mimeType);
      await api.post('/reports', {
        description: `${(locationText || placeLabel).trim()}: ${description.trim()}`,
        latitude: coords.latitude,
        longitude: coords.longitude,
        imageUrl: upload.url,
      });
      setImageUri(null);
      setDescription('');
      Alert.alert('Dispatched ✅', 'Report sent to nearby cleaners.');
      navigation.navigate('My Reports');
    } catch (e) {
      setError(getApiError(e, 'Failed to submit report.'));
    } finally {
      setSubmitting(false);
    }
  };

  const pickerHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body, html { margin: 0; padding: 0; height: 100%; background: #0B0B0C; }
          #map { width: 100%; height: 100%; }
          .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9) saturate(0.6); }
          .center-pin {
            position: absolute; top: 50%; left: 50%; width: 28px; height: 28px;
            background: #1656F5; border: 3px solid #fff; border-radius: 50%;
            transform: translate(-50%, -100%); z-index: 1000; box-shadow: 0 4px 10px rgba(0,0,0,0.6);
          }
        </style>
      </head>
      <body>
        <div class="center-pin"></div>
        <div id="map"></div>
        <script>
          var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([13.0827, 80.2707], 15);
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
          map.on('moveend', function() {
            var center = map.getCenter();
            window.ReactNativeWebView.postMessage(JSON.stringify({ lat: center.lat, lng: center.lng }));
          });
        </script>
      </body>
    </html>
  `;

  return (
    <Page eyebrow="OpenStreetMap" title="Report Waste" subtitle="Pan map to place pin over waste.">
      <Card style={{ overflow: 'hidden' }}>
        <View style={{ height: 240, width: '100%', backgroundColor: '#11141C' }}>
          <WebView
            ref={webViewRef}
            source={{ html: pickerHtml }}
            style={{ flex: 1, backgroundColor: '#11141C' }}
            scrollEnabled={false}
            onMessage={(e) => {
              try {
                const data = JSON.parse(e.nativeEvent.data);
                void updatePosition(data.lat, data.lng);
              } catch {}
            }}
          />
          <View style={cs.osmCorner}>
            <Text style={cs.osmCornerText}>© OpenStreetMap</Text>
          </View>
        </View>

        <View style={{ padding: 14, gap: 10 }}>
          <View style={ui.rowBetween}>
            <ChoiceRow
              value={mode}
              options={[
                { value: 'gps', label: '◎ GPS' },
                { value: 'manual', label: '🔎 Address' },
              ]}
              onChange={setMode}
            />
            <Text style={cs.coords}>
              {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
            </Text>
          </View>
          <Field
            label="Location"
            value={locationText}
            onChangeText={setLocationText}
            placeholder="Landmark or street"
          />
          <View style={ui.row}>
            <View style={{ flex: 1 }}>
              <Button title="◎ Detect GPS" compact kind="soft" onPress={() => void detect()} loading={locationBusy} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Find" kind="secondary" compact onPress={() => void findAddress()} loading={locationBusy} />
            </View>
          </View>
        </View>
      </Card>

      <Card style={{ padding: 15 }}>
        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe waste problem…"
          multiline
        />
        <Text style={cs.sectionLabel}>PHOTO</Text>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={cs.previewImg} resizeMode="cover" />
        ) : (
          <View style={cs.photoPlaceholder}>
            <Text style={{ fontSize: 28 }}>📷</Text>
            <Text style={cs.photoPlaceholderText}>Add waste photo</Text>
          </View>
        )}
        <View style={ui.row}>
          <View style={{ flex: 1 }}>
            <Button compact title="Camera" onPress={() => void pickImage(true)} />
          </View>
          <View style={{ flex: 1 }}>
            <Button compact kind="secondary" title="Gallery" onPress={() => void pickImage(false)} />
          </View>
        </View>
      </Card>

      <ErrorText>{error}</ErrorText>
      <Button
        title={submitting ? 'Submitting…' : 'Submit Report →'}
        kind="accent"
        onPress={() => void submit()}
        loading={submitting}
        disabled={submitting}
      />
    </Page>
  );
}
export function MyReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/reports/mine');
      setReports(res.data);
      setError('');
    } catch (e) {
      setError(getApiError(e, 'Could not load your reports.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchData();
    }, [fetchData]),
  );

  const filtered = reports.filter((r) => {
    if (filter === 'ACTIVE') return ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'CLEANING_COMPLETED'].includes(r.status);
    if (filter === 'RESOLVED') return r.status === 'RESOLVED';
    return true;
  });

  return (
    <Page
      eyebrow="Activity Log"
      title="My Reports"
      subtitle="Track live cleaner assignments and OpenStreetMap locations."
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void fetchData();
      }}
    >
      <ErrorText>{error}</ErrorText>
      <ChoiceRow
        value={filter}
        options={[
          { value: 'ALL', label: `All (${reports.length})` },
          { value: 'ACTIVE', label: 'In Progress' },
          { value: 'RESOLVED', label: 'Resolved' },
        ]}
        onChange={setFilter}
      />
      {loading && !reports.length ? (
        <Text style={ui.body}>Loading reports…</Text>
      ) : filtered.length ? (
        filtered.map((r) => <ReportCard key={r.id} report={r} />)
      ) : (
        <Text style={cs.empty}>No reports match this filter.</Text>
      )}
    </Page>
  );
}

export function CreditsScreen({ cleaner = false, navigation }: { cleaner?: boolean; navigation?: any }) {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<CreditEvent[]>([]);
  const [tab, setTab] = useState<'ALL' | 'EARNED' | 'REDEEMED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/rewards/mine');
      setBalance(res.data.balance ?? 0);
      setHistory(res.data.history ?? []);
      setError('');
    } catch (e) {
      setError(getApiError(e, 'Could not load credits.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchData();
    }, [fetchData]),
  );

  const earnedTotal = history.filter((h) => h.points > 0).reduce((s, h) => s + h.points, 0);
  const spentTotal = history.filter((h) => h.points < 0).reduce((s, h) => s + Math.abs(h.points), 0);
  const filtered = history.filter((h) => (tab === 'EARNED' ? h.points > 0 : tab === 'REDEEMED' ? h.points < 0 : true));
  const tier = getTier(balance);

  return (
    <Page
      eyebrow={cleaner ? 'Cleaner Wallet' : 'Citizen Wallet'}
      title="Credits & Ledger"
      subtitle="Every verified cleanup and report builds your eco-balance."
      refreshing={loading && !history.length}
      onRefresh={() => void fetchData()}
    >
      <ErrorText>{error}</ErrorText>

      <Card dark style={cs.heroWallet}>
        <View style={ui.rowBetween}>
          <Text style={cs.heroEyebrow}>AVAILABLE BALANCE</Text>
          <View style={cs.tierPill}>
            <Text style={cs.tierPillText}>
              {tier.icon} {tier.name}
            </Text>
          </View>
        </View>
        <Text style={[cs.heroBalance, { marginTop: 10 }]}>{loading ? '…' : `${balance} PTS`}</Text>
        <View style={[ui.rowBetween, { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }]}>
          <View>
            <Text style={cs.heroProgressText}>LIFETIME EARNED</Text>
            <Text style={{ color: '#34D399', fontSize: 16, fontWeight: '900', marginTop: 2 }}>+{earnedTotal} pts</Text>
          </View>
          <View>
            <Text style={cs.heroProgressText}>TOTAL REDEEMED</Text>
            <Text style={{ color: '#60A5FA', fontSize: 16, fontWeight: '900', marginTop: 2 }}>-{spentTotal} pts</Text>
          </View>
          {navigation ? (
            <Button compact kind="accent" title="Redeem Store" onPress={() => navigation.navigate('Rewards')} />
          ) : null}
        </View>
      </Card>

      <Card style={{ padding: 15 }}>
        <SectionTitle title="Transaction Ledger" />
        <View style={{ marginTop: 8 }}>
          <ChoiceRow
            value={tab}
            options={[
              { value: 'ALL', label: `All (${history.length})` },
              { value: 'EARNED', label: 'Earned (+)' },
              { value: 'REDEEMED', label: 'Redeemed (-)' },
            ]}
            onChange={setTab}
          />
        </View>
        {!filtered.length ? (
          <Text style={cs.empty}>No credit transactions in this view yet.</Text>
        ) : (
          filtered.map((h) => {
            const isRedeem = h.points < 0;
            return (
              <View key={h.id} style={cs.historyRow}>
                <View style={[cs.txIcon, { backgroundColor: isRedeem ? C.accentSoft : C.organicSoft }]}>
                  <Text style={{ fontSize: 16 }}>{isRedeem ? '🎁' : '⚡'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={cs.cardHeading}>{h.reason}</Text>
                  <Text style={ui.smallMuted}>{new Date(h.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={[cs.points, { color: isRedeem ? C.accent : C.organic }]}>
                  {h.points > 0 ? '+' : ''}
                  {h.points} pts
                </Text>
              </View>
            );
          })
        )}
      </Card>

      <Card style={{ padding: 15 }}>
        <SectionTitle title="Points Schedule by Stream" />
        <Text style={[ui.smallMuted, { marginBottom: 8 }]}>
          Points are granted automatically to both Citizen and Cleaner when an Admin verifies the cleanup.
        </Text>
        {WASTE_OPTIONS.map((w) => (
          <View key={w.value} style={cs.rateRow}>
            <Text style={cs.cardHeading}>{w.label}</Text>
            <Text style={[cs.points, { color: C.organic }]}>+{w.points} pts</Text>
          </View>
        ))}
      </Card>
    </Page>
  );
}

export function RewardsScreen() {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<CreditEvent[]>([]);
  const [catalog, setCatalog] = useState<{ id: string; title: string; cost: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [confirmItem, setConfirmItem] = useState<{ id: string; title: string; cost: number } | null>(null);
  const [voucher, setVoucher] = useState<{ title: string; code: string; cost: number } | null>(null);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [r, c] = await Promise.all([api.get('/rewards/mine'), api.get('/rewards/catalog')]);
      setBalance(r.data.balance ?? 0);
      setHistory(r.data.history ?? []);
      setCatalog(c.data);
      setError('');
    } catch (e) {
      setError(getApiError(e, 'Could not load rewards catalog.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchData();
    }, [fetchData]),
  );

  const executeRedeem = async (item: { id: string; title: string; cost: number }) => {
    setConfirmItem(null);
    setBusyId(item.id);
    setError('');
    try {
      const res = await api.post('/rewards/redeem', { rewardId: item.id });
      const randomCode = `CMX-${item.id.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
      setVoucher({ title: res.data.redeemed ?? item.title, code: randomCode, cost: item.cost });
      await fetchData();
    } catch (e) {
      setError(getApiError(e, 'Redemption failed. Please try again.'));
    } finally {
      setBusyId('');
    }
  };

  const iconFor = (id: string) => (id === 'plant' ? '🌱' : id === 'bag' ? '🛍️' : '🎁');
  const descFor = (id: string) =>
    id === 'plant'
      ? 'Indoor air-purifying sapling delivered via local nursery partner.'
      : id === 'bag'
        ? 'Heavy-duty woven organic cotton tote for zero-plastic shopping.'
        : 'Exclusive CleanMaxx community partner gift box & civic badge.';

  const redeemedPassList = history.filter((h) => h.points < 0);

  return (
    <Page
      eyebrow="Redemption Store"
      title="Eco Rewards"
      subtitle="Turn your verified cleanup credits into real-world eco rewards."
      refreshing={loading && !catalog.length}
      onRefresh={() => void fetchData()}
    >
      <Card dark style={cs.heroWallet}>
        <View style={ui.rowBetween}>
          <View>
            <Text style={cs.heroEyebrow}>REDEEMABLE CREDITS</Text>
            <Text style={[cs.heroBalance, { marginTop: 6 }]}>{loading ? '…' : `${balance} PTS`}</Text>
          </View>
          <View style={cs.trophyCircle}>
            <Text style={{ fontSize: 28 }}>🏆</Text>
          </View>
        </View>
        <Text style={[cs.heroSub, { marginTop: 8 }]}>
          Select a reward below to generate an instant digital redemption voucher.
        </Text>
      </Card>

      <ErrorText>{error}</ErrorText>

      {voucher ? (
        <Card style={cs.voucherBanner}>
          <View style={ui.rowBetween}>
            <Text style={cs.voucherTag}>🎉 INSTANT DIGITAL VOUCHER</Text>
            <Pressable onPress={() => setVoucher(null)}>
              <Text style={ui.smallMuted}>✕</Text>
            </Pressable>
          </View>
          <Text style={[cs.cardHeading, { fontSize: 17, marginTop: 4 }]}>{voucher.title}</Text>
          <View style={cs.voucherCodeBox}>
            <Text style={cs.voucherCodeText}>{voucher.code}</Text>
          </View>
          <Text style={ui.smallMuted}>
            -{voucher.cost} pts deducted · Show this voucher code at any CleanMaxx partner hub.
          </Text>
        </Card>
      ) : null}

      <SectionTitle title="Reward Catalog" />
      {catalog.map((item) => {
        const canAfford = balance >= item.cost;
        const pct = Math.min(100, Math.round((balance / item.cost) * 100));
        const needed = Math.max(0, item.cost - balance);
        return (
          <Card key={item.id} style={{ padding: 16 }}>
            <View style={ui.rowBetween}>
              <View style={cs.rewardIconBox}>
                <Text style={{ fontSize: 28 }}>{iconFor(item.id)}</Text>
              </View>
              <View style={[cs.costPill, canAfford && cs.costPillReady]}>
                <Text style={[cs.costPillText, canAfford && { color: C.organic }]}>
                  {canAfford ? 'UNLOCKED · ' : ''}
                  {item.cost} PTS
                </Text>
              </View>
            </View>

            <Text style={[cs.cardHeading, { fontSize: 16, marginTop: 12 }]}>{item.title}</Text>
            <Text style={[ui.smallMuted, { marginTop: 4 }]}>{descFor(item.id)}</Text>

            <View style={cs.rewardProgressBg}>
              <View
                style={[
                  cs.rewardProgressFill,
                  { width: `${pct}%`, backgroundColor: canAfford ? C.organic : C.accent },
                ]}
              />
            </View>

            <View style={[ui.rowBetween, { marginTop: 12 }]}>
              <Text style={ui.smallMuted}>{canAfford ? 'Ready to claim' : `${needed} more pts needed`}</Text>
              <Button
                compact
                kind={canAfford ? 'primary' : 'secondary'}
                title={busyId === item.id ? 'Redeeming…' : canAfford ? 'Claim Reward →' : 'Locked'}
                disabled={!canAfford || busyId === item.id}
                loading={busyId === item.id}
                onPress={() => setConfirmItem(item)}
              />
            </View>
          </Card>
        );
      })}

      {redeemedPassList.length > 0 ? (
        <Card style={{ padding: 15 }}>
          <SectionTitle title="Your Redeemed Vouchers" />
          {redeemedPassList.map((r) => (
            <View key={r.id} style={cs.historyRow}>
              <Text style={{ fontSize: 20 }}>🎟️</Text>
              <View style={{ flex: 1 }}>
                <Text style={cs.cardHeading}>{r.reason}</Text>
                <Text style={ui.smallMuted}>
                  Pass #{r.id.slice(0, 6).toUpperCase()} · {new Date(r.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={cs.claimedBadge}>
                <Text style={cs.claimedBadgeText}>CLAIMED</Text>
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      <Modal visible={!!confirmItem} transparent animationType="fade" onRequestClose={() => setConfirmItem(null)}>
        <View style={cs.modalOverlay}>
          <View style={cs.confirmBox}>
            <Text style={{ fontSize: 36, textAlign: 'center' }}>{confirmItem ? iconFor(confirmItem.id) : '🎁'}</Text>
            <Text style={cs.confirmTitle}>Confirm Redemption</Text>
            <Text style={cs.confirmSub}>
              Redeem <Text style={{ fontWeight: '800', color: C.ink }}>{confirmItem?.title}</Text> for{' '}
              <Text style={{ fontWeight: '800', color: C.accent }}>{confirmItem?.cost} points</Text>?
            </Text>
            <View style={cs.confirmBalanceRow}>
              <Text style={ui.smallMuted}>Balance after redemption:</Text>
              <Text style={{ fontWeight: '900', color: C.ink }}>
                {balance - (confirmItem?.cost ?? 0)} PTS
              </Text>
            </View>
            <View style={[ui.row, { marginTop: 16 }]}>
              <View style={{ flex: 1 }}>
                <Button title="Cancel" kind="secondary" onPress={() => setConfirmItem(null)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Confirm & Claim"
                  kind="accent"
                  onPress={() => confirmItem && void executeRedeem(confirmItem)}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Page>
  );
}

export function NotificationsScreen() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/notifications/mine');
      setItems(res.data);
      setError('');
    } catch (e) {
      setError(getApiError(e, 'Could not load notifications.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchData();
    }, [fetchData]),
  );

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setItems((old) => old.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {
      Alert.alert('Could not update', getApiError(e));
    }
  };

  return (
    <Page
      eyebrow="Live Feed"
      title="Notifications"
      subtitle="Tap any alert to mark it as read."
      refreshing={loading && !items.length}
      onRefresh={() => void fetchData()}
    >
      <ErrorText>{error}</ErrorText>
      {loading && !items.length ? (
        <Text style={ui.body}>Loading notifications…</Text>
      ) : items.length ? (
        items.map((n) => (
          <Pressable key={n.id} onPress={() => void markRead(n.id)} style={[cs.notification, !n.read && cs.notificationUnread]}>
            <View style={ui.rowBetween}>
              <Text style={[cs.cardHeading, { flex: 1 }]}>{n.message}</Text>
              {!n.read ? <View style={cs.unreadDot} /> : null}
            </View>
            <Text style={ui.smallMuted}>{new Date(n.createdAt).toLocaleString()}</Text>
          </Pressable>
        ))
      ) : (
        <Text style={cs.empty}>You're all caught up! No notifications yet.</Text>
      )}
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
  return (
    <Page eyebrow="Knowledge Hub" title="Learn" subtitle="Short masterclasses on sorting waste & urban sustainability.">
      {videos.map((v) => (
        <Pressable
          key={v.youtubeId}
          onPress={() => void Linking.openURL(`https://www.youtube.com/watch?v=${v.youtubeId}`)}
          style={cs.learningRow}
        >
          <Image source={{ uri: `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg` }} style={cs.learningImage} />
          <View style={{ flex: 1 }}>
            <Text style={cs.eyebrowSmall}>{v.category}</Text>
            <Text style={cs.cardHeading}>{v.title}</Text>
            <Text style={[ui.smallMuted, { color: C.accent, fontWeight: '700', marginTop: 4 }]}>▶ Watch on YouTube</Text>
          </View>
        </Pressable>
      ))}
    </Page>
  );
}

const cs = StyleSheet.create({
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: C.red,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: { color: C.white, fontSize: 10, fontWeight: '900' },
  heroWallet: { padding: 18 },
  heroEyebrow: { color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  heroBalance: { color: C.white, fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  heroSub: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 },
  tierPill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  tierPillText: { color: '#60A5FA', fontSize: 11, fontWeight: '800' },
  progressTrack: {
    height: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: 4, backgroundColor: '#34D399' },
  heroProgressText: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  statsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  empty: { color: C.muted, textAlign: 'center', paddingVertical: 24, fontSize: 13 },
  cardHeading: { color: C.ink, fontSize: 14, fontWeight: '800' },
  coords: { color: C.muted, fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },
  sectionLabel: { color: C.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginBottom: 8 },
  previewImg: { width: '100%', height: 185, borderRadius: 14, marginBottom: 12 },
  photoPlaceholder: {
    borderWidth: 1.5,
    borderColor: C.line,
    borderStyle: 'dashed',
    borderRadius: 14,
    minHeight: 130,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    padding: 16,
    gap: 4,
    backgroundColor: C.paper,
  },
  photoPlaceholderText: { color: C.ink, fontSize: 13, fontWeight: '800' },
  centerPinWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinAddressBubble: {
    maxWidth: 250,
    backgroundColor: 'rgba(9,10,15,0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  pinAddressText: { color: C.white, fontSize: 11, fontWeight: '700' },
  pinHead: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.accent,
    borderWidth: 3,
    borderColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinInnerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.white },
  pinStem: { width: 3, height: 10, backgroundColor: C.white },
  pinShadow: { width: 12, height: 5, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.5)', marginTop: 2 },
  osmCorner: {
    position: 'absolute',
    right: 8,
    bottom: 6,
    backgroundColor: 'rgba(9,10,15,0.75)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  osmCornerText: { color: 'rgba(255,255,255,0.65)', fontSize: 9 },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  txIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  points: { color: C.organic, fontSize: 14, fontWeight: '900' },
  notification: {
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.surface,
    padding: 15,
    borderRadius: 16,
    gap: 6,
  },
  notificationUnread: { borderColor: C.accent, borderWidth: 1.5, backgroundColor: '#F5F8FF' },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.accent },
  trophyCircle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: C.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  costPill: {
    backgroundColor: C.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  costPillReady: { backgroundColor: C.organicSoft },
  costPillText: { color: C.ink, fontSize: 11, fontWeight: '900' },
  rewardProgressBg: {
    height: 6,
    borderRadius: 4,
    backgroundColor: C.surfaceAlt,
    marginTop: 12,
    overflow: 'hidden',
  },
  rewardProgressFill: { height: 6, borderRadius: 4 },
  voucherBanner: {
    padding: 16,
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
    borderWidth: 1.5,
  },
  voucherTag: { color: '#047857', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  voucherCodeBox: {
    backgroundColor: C.ink,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 10,
    alignItems: 'center',
  },
  voucherCodeText: { color: '#34D399', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  claimedBadge: {
    backgroundColor: C.accentSoft,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  claimedBadgeText: { color: C.accent, fontSize: 10, fontWeight: '900' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9,10,15,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  confirmBox: {
    width: '100%',
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: C.line,
  },
  confirmTitle: { color: C.ink, fontSize: 20, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  confirmSub: { color: C.muted, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 19 },
  confirmBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: C.paper,
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
  },
  learningRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
  },
  learningImage: { width: 110, height: 78, borderRadius: 12, backgroundColor: C.accentSoft },
  eyebrowSmall: { color: C.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginBottom: 4, textTransform: 'uppercase' },
});