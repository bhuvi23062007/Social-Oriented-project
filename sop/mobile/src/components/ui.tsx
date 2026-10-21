import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Report, ReportStatus } from '../types';
import { statusLabel, wasteLabel, wastePoints } from '../types';

export const C = {
  ink: '#090A0F',
  darkCard: '#11141C',
  darkSurface: '#181C26',
  paper: '#F6F7F9',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF0F4',
  line: '#E1E5EC',
  muted: '#646D7C',
  accent: '#1656F5',
  accentSoft: '#E5EDFF',
  organic: '#10B981',
  organicSoft: '#D1FAE5',
  glass: '#0D9488',
  white: '#FFFFFF',
  red: '#EF4444',
  redSoft: '#FEE2E2',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
};

export const OSM_DARK_TILES = 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
export const OSM_LIGHT_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export function Enter({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(14)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 340, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(translate, { toValue: 0, duration: 380, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [delay, opacity, translate]);
  return <Animated.View style={{ opacity, transform: [{ translateY: translate }] }}>{children}</Animated.View>;
}

export function PulseDot({ color = C.organic }: { color?: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, { toValue: 1, duration: 1500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return (
    <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: color,
          opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
          transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 2.2] }) }],
        }}
      />
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

export function Page({
  title,
  subtitle,
  eyebrow,
  rightAction,
  children,
  refreshing,
  onRefresh,
  contentStyle,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: ViewStyle;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.page, contentStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={C.accent} /> : undefined}
      >
        <Enter>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              {eyebrow ? (
                <View style={styles.eyebrowWrap}>
                  <View style={styles.eyebrowDot} />
                  <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>
                </View>
              ) : null}
              <Text style={styles.pageTitle}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {rightAction ? <View>{rightAction}</View> : null}
          </View>
        </Enter>
        <Enter delay={60}>
          <View style={{ gap: 14 }}>{children}</View>
        </Enter>
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, style, dark = false }: { children: React.ReactNode; style?: ViewStyle; dark?: boolean }) {
  return (
    <Enter>
      <View style={[styles.card, dark && styles.cardDark, style]}>{children}</View>
    </Enter>
  );
}

export function Button({
  title,
  onPress,
  kind = 'primary',
  disabled = false,
  loading = false,
  compact = false,
  icon,
}: {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'danger' | 'soft' | 'accent';
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  icon?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

  const bg =
    kind === 'primary'
      ? C.ink
      : kind === 'accent'
        ? C.accent
        : kind === 'danger'
          ? C.red
          : kind === 'soft'
            ? C.accentSoft
            : C.surface;
  const fg = kind === 'primary' || kind === 'accent' || kind === 'danger' ? C.white : kind === 'soft' ? C.accent : C.ink;
  const border = kind === 'secondary' ? C.line : bg;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled || loading}
        style={[
          styles.button,
          { backgroundColor: bg, borderColor: border },
          compact && styles.buttonCompact,
          (disabled || loading) && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <View style={ui.row}>
            {icon ? <Text style={{ fontSize: compact ? 13 : 15, color: fg }}>{icon}</Text> : null}
            <Text style={[styles.buttonText, { color: fg }, compact && { fontSize: 12 }]}>{title}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  multiline,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  multiline?: boolean;
  editable?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#949CA9"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        editable={editable}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        style={[
          styles.input,
          focused && styles.inputFocused,
          multiline && styles.multiline,
          !editable && { opacity: 0.6 },
        ]}
      />
    </View>
  );
}

export function ChoiceRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text> : null}
      <View style={styles.choiceWrap}>
        {options.map((o) => {
          const active = value === o.value;
          return (
            <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.choice, active && styles.choiceSelected]}>
              <Text style={[styles.choiceText, active && styles.choiceTextSelected]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>⚠️  {children}</Text>
    </View>
  );
}

export function Loading({ label = 'Loading CleanMaxx…' }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <View style={styles.loadingBadge}>
        <Text style={styles.loadingBadgeText}>CMX</Text>
      </View>
      <ActivityIndicator color={C.accent} size="large" />
      <Text style={styles.subtitle}>{label}</Text>
    </View>
  );
}

export function Stat({
  label,
  value,
  accent = false,
  icon,
  onPress,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  icon?: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={ui.rowBetween}>
        <Text style={[styles.statValue, accent && { color: C.accent }]}>{value}</Text>
        {icon ? <Text style={{ fontSize: 16 }}>{icon}</Text> : null}
      </View>
      <Text style={styles.statLabel}>{label.toUpperCase()}</Text>
    </>
  );
  return onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.stat, pressed && { opacity: 0.85 }]}>
      {content}
    </Pressable>
  ) : (
    <View style={styles.stat}>{content}</View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.link}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function StatusPill({ status }: { status: ReportStatus }) {
  const tone =
    status === 'RESOLVED'
      ? C.organic
      : status === 'REJECTED'
        ? C.red
        : status === 'PENDING'
          ? C.warning
          : C.accent;
  const bg =
    status === 'RESOLVED'
      ? C.organicSoft
      : status === 'REJECTED'
        ? C.redSoft
        : status === 'PENDING'
          ? C.warningSoft
          : C.accentSoft;
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <View style={[styles.pillDot, { backgroundColor: tone }]} />
      <Text style={[styles.pillText, { color: tone }]}>{statusLabel(status)}</Text>
    </View>
  );
}

export function OsmMapModal({
  visible,
  onClose,
  dest,
  me,
  title = 'OpenStreetMap View',
}: {
  visible: boolean;
  onClose: () => void;
  dest: { latitude: number; longitude: number } | null;
  me?: { latitude: number; longitude: number } | null;
  title?: string;
}) {
  const { WebView } = require('react-native-webview');

  if (!dest) return null;

  const htmlContent = `
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
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${dest.latitude}, ${dest.longitude}], 16);
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
          
          var destIcon = L.divIcon({
            className: '',
            html: '<div style="width:26px;height:26px;background:#EF4444;border:3px solid #fff;border-radius:50%;box-shadow:0 3px 8px rgba(0,0,0,0.5)"></div>',
            iconSize: [26, 26],
            iconAnchor: [13, 13]
          });
          L.marker([${dest.latitude}, ${dest.longitude}], { icon: destIcon }).addTo(map);

          ${me ? `
            var meIcon = L.divIcon({
              className: '',
              html: '<div style="width:24px;height:24px;background:#3B82F6;border:3px solid #fff;border-radius:50%;box-shadow:0 3px 8px rgba(0,0,0,0.5)"></div>',
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });
            L.marker([${me.latitude},${me.longitude}], { icon: meIcon }).addTo(map);
            var bounds = L.latLngBounds([[${dest.latitude},${dest.longitude}], [${me.latitude},${me.longitude}]]);
            map.fitBounds(bounds, { padding: [60, 60] });
          ` : ''}
        </script>
      </body>
    </html>
  `;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalEyebrow}>OPENSTREETMAP · LEAFLET</Text>
              <Text style={styles.modalTitle} numberOfLines={1}>{title}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <Text style={{ color: C.white, fontWeight: '800', fontSize: 15 }}>✕</Text>
            </Pressable>
          </View>

          <View style={{ flex: 1, backgroundColor: '#11141C' }}>
            <WebView source={{ html: htmlContent }} style={{ flex: 1, backgroundColor: '#11141C' }} scrollEnabled={false} />
          </View>

          <View style={styles.modalFooter}>
            <Text style={styles.modalCoords}>📍 {dest.latitude.toFixed(5)}, {dest.longitude.toFixed(5)}</Text>
            <Button compact title="Done" kind="accent" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function ReportCard({
  report,
  footer,
  onPress,
  showMapButton = true,
}: {
  report: Report;
  footer?: React.ReactNode;
  onPress?: () => void;
  showMapButton?: boolean;
}) {
  const [mapOpen, setMapOpen] = useState(false);
  const before = report.images?.find((image) => image.type !== 'AFTER') ?? report.images?.[0];
  const pts = wastePoints(report.wasteType);
  const locationTitle = (report.description || '').split(':')[0] || 'Reported spot';
  const details = (report.description || '').split(':').slice(1).join(':').trim();

  return (
    <>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [styles.card, pressed && onPress && { opacity: 0.92 }]}
      >
        {before?.url ? (
          <View>
            <Image source={{ uri: before.url }} style={styles.reportImage} resizeMode="cover" />
            <View style={styles.pointsBadgeOverlay}>
              <Text style={styles.pointsBadgeText}>+{pts} PTS</Text>
            </View>
          </View>
        ) : null}
        <View style={{ padding: 15 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.mono}>#{report.id.slice(0, 8).toUpperCase()}</Text>
            <StatusPill status={report.status} />
          </View>
          <Text style={styles.cardTitle}>{wasteLabel(report.wasteType)}</Text>
          <Text style={styles.bodyText}>{locationTitle}</Text>
          {details ? <Text style={styles.smallMuted}>{details}</Text> : null}
          {report.reporter?.name ? <Text style={styles.smallMuted}>Reporter: {report.reporter.name}</Text> : null}
          <View style={[styles.rowBetween, { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.line }]}>
            <Text style={styles.smallMuted}>
              {new Date(report.createdAt).toLocaleDateString()} · {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
            </Text>
            {showMapButton ? (
              <Pressable onPress={() => setMapOpen(true)} style={styles.mapChip}>
                <Text style={styles.mapChipText}>🗺️ OSM Map</Text>
              </Pressable>
            ) : null}
          </View>
          {footer ? <View style={{ marginTop: 12 }}>{footer}</View> : null}
        </View>
      </Pressable>
      <OsmMapModal
        visible={mapOpen}
        onClose={() => setMapOpen(false)}
        dest={{ latitude: report.latitude, longitude: report.longitude }}
        title={wasteLabel(report.wasteType)}
      />
    </>
  );
}

export const ui = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  body: { color: C.ink, fontSize: 14, lineHeight: 20 },
  smallMuted: { color: C.muted, fontSize: 12, lineHeight: 18 },
  link: { color: C.accent, fontSize: 13, fontWeight: '800' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.paper },
  page: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 40, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  eyebrowWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  eyebrowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },
  eyebrow: { color: C.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  pageTitle: { fontSize: 28, color: C.ink, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { color: C.muted, fontSize: 13, lineHeight: 19, marginTop: 3 },
  card: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#090A0F',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardDark: {
    backgroundColor: C.darkCard,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  button: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCompact: { minHeight: 38, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 11 },
  buttonText: { fontSize: 14, fontWeight: '800', textAlign: 'center', letterSpacing: -0.2 },
  disabled: { opacity: 0.45 },
  fieldWrap: { marginBottom: 12 },
  fieldLabel: { color: C.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginBottom: 6 },
  input: {
    minHeight: 48,
    borderWidth: 1.2,
    borderColor: C.line,
    borderRadius: 13,
    backgroundColor: C.paper,
    color: C.ink,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    fontWeight: '500',
  },
  inputFocused: { borderColor: C.accent, backgroundColor: C.white },
  multiline: { minHeight: 92, textAlignVertical: 'top' },
  choiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 999,
    backgroundColor: C.surface,
  },
  choiceSelected: { backgroundColor: C.ink, borderColor: C.ink },
  choiceText: { fontSize: 12, color: C.muted, fontWeight: '700' },
  choiceTextSelected: { color: C.white },
  errorBox: {
    backgroundColor: C.redSoft,
    borderRadius: 13,
    padding: 12,
    borderColor: '#FCA5A5',
    borderWidth: 1,
  },
  errorText: { color: '#991B1B', fontSize: 12, fontWeight: '600', lineHeight: 18 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, backgroundColor: C.paper, padding: 24 },
  loadingBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: C.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  loadingBadgeText: { color: C.white, fontWeight: '900', fontSize: 18 },
  stat: {
    minWidth: '46%',
    flexGrow: 1,
    padding: 15,
    borderRadius: 16,
    backgroundColor: C.surface,
    borderColor: C.line,
    borderWidth: 1,
    gap: 6,
  },
  statValue: { fontSize: 26, fontWeight: '900', color: C.ink, letterSpacing: -0.6 },
  statLabel: { color: C.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sectionTitle: { color: C.ink, fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  link: { color: C.accent, fontSize: 13, fontWeight: '800' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  mono: { color: C.muted, fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },
  cardTitle: { color: C.ink, fontSize: 16, fontWeight: '900', marginTop: 8, letterSpacing: -0.3 },
  bodyText: { color: C.ink, fontSize: 13, fontWeight: '600', lineHeight: 19, marginTop: 3 },
  smallMuted: { color: C.muted, fontSize: 11, marginTop: 4 },
  reportImage: { width: '100%', height: 165, backgroundColor: C.accentSoft },
  pointsBadgeOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(9,10,15,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  pointsBadgeText: { color: '#34D399', fontSize: 11, fontWeight: '900' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  mapChip: {
    backgroundColor: C.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  mapChipText: { color: C.accent, fontSize: 11, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  modalSheet: {
    height: '80%',
    backgroundColor: C.darkCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: C.ink,
  },
  modalEyebrow: { color: '#60A5FA', fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  modalTitle: { color: C.white, fontSize: 16, fontWeight: '900', marginTop: 2 },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  osmBadge: {
    position: 'absolute',
    bottom: 8,
    right: 10,
    backgroundColor: 'rgba(9,10,15,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  osmBadgeText: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '600' },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: C.ink,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  modalCoords: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' },
});