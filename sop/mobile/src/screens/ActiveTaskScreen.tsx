import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  Vibration,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { api, getApiError, uploadImage } from '../api';

interface Pt {
  latitude: number;
  longitude: number;
}
interface Pos extends Pt {
  heading: number | null;
  accuracy: number;
  speed: number | null;
}
interface Task {
  id: string;
  description: string;
  latitude: number;
  longitude: number;
  wasteType: string;
  onSiteMeters: number;
  images: { url: string; type?: string }[];
  reporter?: { name?: string } | null;
}
interface Step {
  text: string;
  distance: number;
  type: string;
  modifier?: string;
}
interface RouteInfo {
  coords: Pt[];
  distance: number;
  duration: number;
  steps: Step[];
}


const WASTE: Record<string, { label: string; points: number }> = {
  LITTER: { label: 'Litter on street / roadside', points: 10 },
  BIN_OVERFLOW: { label: 'Overflowing public bin', points: 15 },
  GARBAGE_PILE: { label: 'Garbage pile / dumped bags', points: 25 },
  DRAIN_BLOCK: { label: 'Waste blocking a drain', points: 30 },
  BULK_DUMP: { label: 'Large dumping (debris, furniture)', points: 50 },
};

const DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1d2126' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8d96a0' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d2126' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#3a4149' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#4a535c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f1418' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

function distM(a: Pt, b: Pt): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
const fmtDist = (m: number) =>
  m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toFixed(1)} km`;
const fmtMin = (s: number) => `${Math.max(1, Math.round(s / 60))} min`;

function describe(type: string, modifier: string | undefined, name: string): string {
  const onto = name ? ` onto ${name}` : '';
  const side = modifier ?? 'straight';
  switch (type) {
    case 'depart':
      return name ? `Head out on ${name}` : 'Start heading out';
    case 'arrive':
      return 'You have arrived at the spot';
    case 'turn':
      return side === 'straight' ? `Continue straight${onto}` : `Turn ${side}${onto}`;
    case 'end of road':
      return `At the end of the road, turn ${side}${onto}`;
    case 'fork':
      return `Keep ${side.includes('left') ? 'left' : 'right'} at the fork`;
    case 'merge':
      return `Merge${onto}`;
    case 'roundabout':
    case 'rotary':
      return `Enter the roundabout${onto}`;
    default:
      return `Continue ${side}${name ? ` on ${name}` : ''}`;
  }
}

function arrow(type: string, modifier?: string): string {
  if (type === 'arrive') return '📍';
  if (modifier?.includes('uturn')) return '↩';
  if (modifier?.includes('left')) return '←';
  if (modifier?.includes('right')) return '→';
  return '↑';
}

// free OSRM demo server
async function fetchRoute(from: Pt, to: Pt): Promise<RouteInfo | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data: any = await res.json();
    const r = data.routes?.[0];
    if (!r) return null;
    const coords: Pt[] = r.geometry.coordinates.map(([lng, lat]: [number, number]) => ({
      latitude: lat,
      longitude: lng,
    }));
    coords.push(to);
    return {
      coords,
      distance: r.distance,
      duration: r.duration,
      steps: r.legs[0].steps.map((s: any) => ({
        text: describe(s.maneuver.type, s.maneuver.modifier, s.name),
        distance: s.distance,
        type: s.maneuver.type,
        modifier: s.maneuver.modifier,
      })),
    };
  } catch {
    return null;
  }
}

/* ---------- small animated helpers ---------- */

function FadeIn({ children }: { children: React.ReactNode }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, [a]);
  return (
    <Animated.View
      style={{ opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}
    >
      {children}
    </Animated.View>
  );
}

function LiveDot({ color }: { color: string }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(a, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [a]);
  return (
    <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: color,
          opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
          transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.2] }) }],
        }}
      />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

function ScaleButton({
  onPress,
  disabled,
  style,
  children,
}: {
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (v: number) =>
    Animated.spring(s, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  return (
    <Animated.View style={{ transform: [{ scale: s }] }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => to(0.97)}
        onPressOut={() => to(1)}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

/* ---------- screen ---------- */

export default function ActiveTaskScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const webViewRef = useRef<WebView>(null);

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [pos, setPos] = useState<Pos | null>(null);
  const [locError, setLocError] = useState('');
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [follow, setFollow] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [canForce, setCanForce] = useState(false);

  const lastPush = useRef(0);
  const lastRoute = useRef<{ latitude: number; longitude: number; t: number } | null>(null);
  const arrived = useRef(false);
  const sheetY = useRef(new Animated.Value(420)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const bannerScale = useRef(new Animated.Value(1)).current;

  const goHome = useCallback(() => {
    navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
  }, [navigation]);

  // load the active task
  useEffect(() => {
    api
      .get('/reports/active')
      .then((res) => setTask(res.data?.task ?? null))
      .catch(() => setTask(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && !task) goHome();
  }, [loading, task, goHome]);

  // sheet slides up once the task is ready
  useEffect(() => {
    if (task) Animated.spring(sheetY, { toValue: 0, useNativeDriver: true, speed: 12, bounciness: 8 }).start();
  }, [task, sheetY]);

  // live GPS + keep the server copy fresh
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;
    (async () => {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setLocError('Allow location access to navigate and complete the task.');
        return;
      }
      const s = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 5 },
        (p) => {
          const c = p.coords;
          const heading = c.heading != null && c.heading >= 0 ? c.heading : null;
          setLocError('');
          setPos({ latitude: c.latitude, longitude: c.longitude, heading, accuracy: c.accuracy ?? 999, speed: c.speed });
          if (Date.now() - lastPush.current >= 10000) {
            lastPush.current = Date.now();
            api
              .patch('/reports/cleaner/location', { latitude: c.latitude, longitude: c.longitude })
              .catch(() => {
                lastPush.current = 0;
              });
          }
        },
      );
      if (cancelled) s.remove();
      else sub = s;
    })();
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, []);

  // recalculate the route when you move 40 m+ (max every 8 s), or every minute
  useEffect(() => {
    if (!pos || !task) return;
    const l = lastRoute.current;
    const age = l ? Date.now() - l.t : Infinity;
    const moved = l ? distM(l, pos) : Infinity;
    if (age < 8000 || (moved < 40 && age < 60000)) return;
    lastRoute.current = { latitude: pos.latitude, longitude: pos.longitude, t: Date.now() };
    fetchRoute(pos, { latitude: task.latitude, longitude: task.longitude }).then((r) => {
      if (!r) return;
      setRoute(r);
      setTotal((t) => t ?? r.distance);
    });
  }, [pos, task]);

  // camera follows the cleaner
  useEffect(() => {
    if (!follow || !pos) return;
    webViewRef.current?.injectJavaScript(`
      map.setView([${pos.latitude}, ${pos.longitude}], 17, { animate: true });
      true;
    `);
  }, [pos?.latitude, pos?.longitude, follow]);

  const dest: Pt | null = task ? { latitude: task.latitude, longitude: task.longitude } : null;
  const dM = pos && dest ? distM(pos, dest) : null;
  const onSite = !!task && dM != null && dM <= task.onSiteMeters;
  const remaining = route ? route.distance : (dM ?? 0);
  const pct = total ? Math.min(100, Math.max(0, (1 - remaining / total) * 100)) : 0;

  useEffect(() => {
    Animated.timing(progress, { toValue: pct, duration: 600, useNativeDriver: false }).start();
  }, [pct, progress]);

  // buzz + bounce once when you reach the spot
  useEffect(() => {
    if (onSite && !arrived.current) {
      arrived.current = true;
      Vibration.vibrate([0, 200, 100, 200]);
      Animated.sequence([
        Animated.timing(bannerScale, { toValue: 1.04, duration: 160, useNativeDriver: true }),
        Animated.spring(bannerScale, { toValue: 1, useNativeDriver: true, bounciness: 14 }),
      ]).start();
    }
  }, [onSite, bannerScale]);

  const takePhoto = async () => {
    setError('');
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError('Allow camera access to take the after photo.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (res.canceled || !res.assets?.[0]) return;
    const uri = res.assets[0].uri;
    setPhoto(uri);
    setUploadedUrl(null);
    setCanForce(false);
    setUploading(true);
    try {
      const up = await uploadImage(uri, 'after.jpg', 'image/jpeg');
      setUploadedUrl(up.url);
    } catch (e) {
      setError(getApiError(e, 'Upload failed. Retake the photo.'));
      setPhoto(null);
    } finally {
      setUploading(false);
    }
  };

  const complete = async (force: boolean) => {
    if (!task || !uploadedUrl || !pos) return;
    setBusy(true);
    setError('');
    try {
      await api.post(`/reports/${task.id}/complete`, {
        afterImageUrl: uploadedUrl,
        latitude: pos.latitude,
        longitude: pos.longitude,
        force,
      });
      goHome();
    } catch (e: any) {
      const d = e?.response?.data;
      setError(getApiError(e, 'Could not complete. Try again.'));
      if (d?.code === 'NOT_CLEANED') {
        setCanForce(true);
      } else if (/too old|fresh photo/i.test(String(d?.message ?? ''))) {
        setPhoto(null);
        setUploadedUrl(null);
        setCanForce(false);
      }
    } finally {
      setBusy(false);
    }
  };

  const release = () => {
    if (!task) return;
    Alert.alert('Cancel this task?', 'It goes back to the open requests.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel task',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`/reports/${task.id}/release`);
            goHome();
          } catch (e) {
            setError(getApiError(e, 'Could not cancel. Try again.'));
          }
        },
      },
    ]);
  };

  if (loading || !task || !dest) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  const info = WASTE[task.wasteType] ?? { label: 'Waste', points: 10 };
  const next = route ? (route.steps[1] ?? route.steps[0]) : null;
  const after = route?.steps[2] ?? null;
  const toNext = route ? (route.steps[1] ? route.steps[0].distance : route.distance) : 0;
  const arrival = route
    ? new Date(Date.now() + route.duration * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;
  const before = task.images.find((i) => i.type !== 'AFTER');
  const acc = pos?.accuracy ?? 999;
  const accColor = acc <= 30 ? '#34d399' : acc <= 100 ? '#fbbf24' : '#f87171';
  const kmh = pos?.speed != null && pos.speed > 0.5 ? Math.round(pos.speed * 3.6) : null;

  let ctaLabel: string;
  let ctaOn = false;
  if (!pos) ctaLabel = 'Waiting for GPS…';
  else if (!onSite) ctaLabel = `${fmtDist(dM ?? 0)} to the spot`;
  else if (uploading) ctaLabel = 'Uploading photo…';
  else if (!photo) {
    ctaLabel = 'Take after photo';
    ctaOn = true;
  } else {
    ctaLabel = busy ? 'Submitting…' : 'Complete task';
    ctaOn = !busy && !!uploadedUrl;
  }

  return (
    <View style={s.root}>
      <View style={StyleSheet.absoluteFill}>
        <WebView
          source={{
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                  <style>
                    body, html { margin: 0; padding: 0; height: 100%; background: #0b0d10; }
                    #map { width: 100%; height: 100%; }
                    .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(0.9) contrast(0.85) saturate(0.6); }
                  </style>
                </head>
                <body>
                  <div id="map"></div>
                  <script>
                    var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${dest.latitude}, ${dest.longitude}], 16);
                    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

                    var destIcon = L.divIcon({
                      className: '',
                      html: '<div style="width:28px;height:28px;background:#EF4444;border:3px solid #fff;border-radius:50%;box-shadow:0 3px 8px rgba(0,0,0,0.5)"></div>',
                      iconSize: [28, 28],
                      iconAnchor: [14, 14]
                    });
                    L.marker([${dest.latitude}, ${dest.longitude}], { icon: destIcon }).addTo(map);

                    ${pos ? `
                      var meIcon = L.divIcon({
                        className: '',
                        html: '<div style="width:24px;height:24px;background:#3B82F6;border:3px solid #fff;border-radius:50%;box-shadow:0 3px 8px rgba(0,0,0,0.5)"></div>',
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                      });
                      L.marker([${pos.latitude},${pos.longitude}], { icon: meIcon }).addTo(map);
                    ` : ''}
                  </script>
                </body>
              </html>
            `,
          }}
          style={{ flex: 1, backgroundColor: '#0b0d10' }}
          scrollEnabled={false}
        />
      </View>

      {/* top: turn-by-turn */}
      <View style={[s.topWrap, { top: insets.top + 8 }]} pointerEvents="box-none">
        <Animated.View style={[s.topCard, onSite && s.topCardOn, { transform: [{ scale: bannerScale }] }]}>
          {locError ? (
            <Text style={s.white}>{locError}</Text>
          ) : !pos ? (
            <Text style={s.white}>Getting your GPS…</Text>
          ) : onSite ? (
            <View style={s.row}>
              <View style={[s.arrowBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={s.arrowText}>📍</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.bigDist}>You've arrived</Text>
                <Text style={s.stepText}>Take the after photo to finish the job</Text>
              </View>
            </View>
          ) : !next ? (
            <View>
              <Text style={s.bigDist}>Head to the pin · {fmtDist(dM ?? 0)}</Text>
              <Text style={s.stepText}>Finding turn-by-turn directions…</Text>
            </View>
          ) : (
            <FadeIn key={next.text + Math.round(toNext / 50)}>
              <View style={s.row}>
                <View style={s.arrowBox}>
                  <Text style={s.arrowText}>{arrow(next.type, next.modifier)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.bigDist}>{fmtDist(toNext)}</Text>
                  <Text style={s.stepText} numberOfLines={1}>
                    {next.text}
                  </Text>
                </View>
              </View>
              {after && (
                <Text style={s.thenText} numberOfLines={1}>
                  Then {arrow(after.type, after.modifier)} {after.text}
                </Text>
              )}
            </FadeIn>
          )}
        </Animated.View>

        {pos && (
          <View style={s.chips}>
            <View style={s.chip}>
              <LiveDot color={accColor} />
              <Text style={s.chipText}>LIVE · GPS ±{Math.round(acc)} m</Text>
            </View>
            {kmh != null && (
              <View style={s.chip}>
                <Text style={s.chipText}>{kmh} km/h</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* map controls */}
      <View style={[s.controls, { bottom: height * 0.42 }]} pointerEvents="box-none">
        <ScaleButton onPress={() => setFollow(true)} style={s.ctrl}>
          <Text style={[s.ctrlText, follow && { color: '#60a5fa' }]}>◎</Text>
        </ScaleButton>
       <ScaleButton
          onPress={() => {
            setFollow(false);
            if (pos && dest) {
              webViewRef.current?.injectJavaScript(`
                var bounds = L.latLngBounds([[${dest.latitude}, ${dest.longitude}], [${pos.latitude}, ${pos.longitude}]]);
                map.fitBounds(bounds, { padding: [60, 60] });
                true;
              `);
            }
          }}
          style={s.ctrl}
        >
          <Text style={s.ctrlText}>⤢</Text>
        </ScaleButton>
      </View>

      {/* bottom sheet */}
      <Animated.View style={[s.sheet, { transform: [{ translateY: sheetY }], paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable onPress={() => setExpanded((v) => !v)} style={{ paddingBottom: 10 }}>
          <View style={s.handle} />
        </Pressable>

        <ScrollView style={{ maxHeight: height * 0.55 }} showsVerticalScrollIndicator={false}>
          <View style={[s.row, { justifyContent: 'space-between', alignItems: 'flex-end' }]}>
            <View>
              <Text style={s.eta}>{route ? fmtMin(route.duration) : '--'}</Text>
              <Text style={s.etaSub}>
                {route
                  ? `${fmtDist(remaining)}${arrival ? ` · arrive ${arrival}` : ''}`
                  : dM != null
                    ? `${fmtDist(dM)} away`
                    : 'Finding route…'}
              </Text>
            </View>
            <View style={s.pts}>
              <Text style={s.ptsText}>+{info.points} pts</Text>
            </View>
          </View>

          <View style={s.barBg}>
            <Animated.View
              style={[s.barFill, { width: progress.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]}
            />
          </View>

          <ScaleButton
            onPress={() => (photo ? complete(false) : takePhoto())}
            disabled={!ctaOn}
            style={[s.cta, { backgroundColor: ctaOn ? '#10b981' : 'rgba(255,255,255,0.1)' }]}
          >
            <Text style={[s.ctaText, !ctaOn && { color: 'rgba(255,255,255,0.65)' }]}>{ctaLabel}</Text>
          </ScaleButton>

          {photo && (
            <FadeIn>
              <View style={[s.row, { marginTop: 12 }]}>
                <Image source={{ uri: photo }} style={s.thumb} />
                <Text style={[s.etaSub, { flex: 1 }]}>{uploading ? 'Uploading…' : 'After photo ready'}</Text>
                <Pressable onPress={takePhoto}>
                  <Text style={s.link}>Retake</Text>
                </Pressable>
              </View>
            </FadeIn>
          )}

          {!!error && (
            <FadeIn>
              <Text style={s.error}>{error}</Text>
            </FadeIn>
          )}

          {canForce && (
            <ScaleButton onPress={() => complete(true)} disabled={busy} style={s.force}>
              <Text style={s.forceText}>Submit anyway (admin will review)</Text>
            </ScaleButton>
          )}

          <ScaleButton onPress={release} style={s.cancel}>
            <Text style={s.cancelText}>Cancel task</Text>
          </ScaleButton>

          {expanded && (
            <FadeIn>
              <View style={s.details}>
                {before && <Image source={{ uri: before.url }} style={s.beforeImg} />}
                <View style={{ flex: 1 }}>
                  <Text style={s.detailTitle}>{info.label}</Text>
                  <Text style={s.etaSub}>{task.description.split(':')[0]}</Text>
                  <Text style={[s.etaSub, { opacity: 0.6, marginTop: 4 }]}>
                    Reported by {task.reporter?.name ?? 'a citizen'}
                  </Text>
                </View>
              </View>
              {route &&
                route.steps.slice(1).map((st, i) => (
                  <View key={i} style={[s.row, { marginTop: 8 }]}>
                    <View style={s.stepIcon}>
                      <Text style={{ color: '#fff' }}>{arrow(st.type, st.modifier)}</Text>
                    </View>
                    <Text style={[s.etaSub, { flex: 1, color: 'rgba(255,255,255,0.8)' }]}>{st.text}</Text>
                    <Text style={[s.etaSub, { opacity: 0.5 }]}>{fmtDist(route.steps[i].distance)}</Text>
                  </View>
                ))}
            </FadeIn>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b0d10' },
  white: { color: '#fff', fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  meDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    borderWidth: 3,
    borderColor: '#fff',
  },
  topWrap: { position: 'absolute', left: 12, right: 12 },
  topCard: {
    borderRadius: 24,
    padding: 16,
    backgroundColor: 'rgba(16,19,24,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  topCardOn: { backgroundColor: 'rgba(5,150,105,0.96)' },
  arrowBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  bigDist: { color: '#fff', fontSize: 26, fontWeight: '900' },
  stepText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 2 },
  thenText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  chips: { flexDirection: 'row', gap: 8, marginTop: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16,19,24,0.92)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  controls: { position: 'absolute', right: 12, gap: 10 },
  ctrl: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(16,19,24,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlText: { color: '#fff', fontSize: 20 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(16,19,24,0.98)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  eta: { color: '#fff', fontSize: 30, fontWeight: '900' },
  etaSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  pts: { backgroundColor: 'rgba(16,185,129,0.2)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  ptsText: { color: '#6ee7b7', fontWeight: '900', fontSize: 14 },
  barBg: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 12, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3, backgroundColor: '#3b82f6' },
  cta: { marginTop: 16, borderRadius: 18, paddingVertical: 15, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  thumb: { width: 48, height: 48, borderRadius: 10 },
  link: { color: '#60a5fa', fontSize: 12, textDecorationLine: 'underline' },
  error: { color: '#fca5a5', fontSize: 12, marginTop: 10 },
  force: {
    marginTop: 10,
    borderRadius: 18,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.4)',
  },
  forceText: { color: '#fcd34d', fontWeight: '600', fontSize: 14 },
  cancel: {
    marginTop: 12,
    borderRadius: 18,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
  },
  cancelText: { color: '#fca5a5', fontWeight: '600', fontSize: 14 },
  details: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  beforeImg: { width: 64, height: 64, borderRadius: 12 },
  detailTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});