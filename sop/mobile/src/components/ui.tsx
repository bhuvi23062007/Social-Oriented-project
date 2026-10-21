import React from 'react';
import {
  ActivityIndicator, Image, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, View, ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Report, ReportStatus } from '../types';
import { statusLabel, wasteLabel } from '../types';

export const C = {
  ink: '#0B0B0C', paper: '#FAFAFA', surface: '#F0F1F4', line: '#D8DCE3',
  muted: '#5B6270', accent: '#1656F5', accentSoft: '#E3EBFF', organic: '#557A3E',
  glass: '#1E8B80', white: '#FFFFFF', red: '#B42318', warning: '#A5711F',
};

export function Page({
  title, subtitle, eyebrow, children, refreshing, onRefresh, contentStyle,
}: {
  title: string; subtitle?: string; eyebrow?: string; children: React.ReactNode;
  refreshing?: boolean; onRefresh?: () => void; contentStyle?: ViewStyle;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.page, contentStyle]}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={C.accent} /> : undefined}
      >
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
        <Text style={styles.pageTitle}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  title, onPress, kind = 'primary', disabled = false, loading = false, compact = false,
}: {
  title: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'danger' | 'soft';
  disabled?: boolean; loading?: boolean; compact?: boolean;
}) {
  const bg = kind === 'primary' ? C.ink : kind === 'danger' ? C.red : kind === 'soft' ? C.accentSoft : C.white;
  const fg = kind === 'primary' || kind === 'danger' ? C.white : kind === 'soft' ? C.accent : C.ink;
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [
      styles.button, { backgroundColor: bg, borderColor: kind === 'secondary' ? C.line : bg },
      compact && styles.buttonCompact, (disabled || loading) && styles.disabled, pressed && !disabled && styles.pressed,
    ]}>
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.buttonText, { color: fg }, compact && { fontSize: 12 }]}>{title}</Text>}
    </Pressable>
  );
}

export function Field({
  label, value, onChangeText, placeholder, secureTextEntry, keyboardType, multiline, editable = true,
}: {
  label: string; value: string; onChangeText: (value: string) => void; placeholder?: string;
  secureTextEntry?: boolean; keyboardType?: any; multiline?: boolean; editable?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text>
      <TextInput
        value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#8B919B"
        secureTextEntry={secureTextEntry} keyboardType={keyboardType} multiline={multiline} editable={editable}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        style={[styles.input, multiline && styles.multiline, !editable && { opacity: 0.65 }]}
      />
    </View>
  );
}

export function ChoiceRow<T extends string>({
  label, value, options, onChange,
}: { label?: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text> : null}
      <View style={styles.choiceWrap}>
        {options.map((o) => (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.choice, value === o.value && styles.choiceSelected]}>
            <Text style={[styles.choiceText, value === o.value && styles.choiceTextSelected]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <View style={styles.errorBox}><Text style={styles.errorText}>{children}</Text></View>;
}

export function Loading({ label = 'Loading...' }: { label?: string }) {
  return <View style={styles.loading}><ActivityIndicator color={C.accent} size="large" /><Text style={styles.subtitle}>{label}</Text></View>;
}

export function Stat({ label, value, accent = false, onPress }: { label: string; value: string | number; accent?: boolean; onPress?: () => void }) {
  const content = <><Text style={[styles.statValue, accent && { color: C.accent }]}>{value}</Text><Text style={styles.fieldLabel}>{label.toUpperCase()}</Text></>;
  return onPress ? <Pressable onPress={onPress} style={styles.stat}>{content}</Pressable> : <View style={styles.stat}>{content}</View>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text>{action && onAction ? <Pressable onPress={onAction}><Text style={styles.link}>{action}</Text></Pressable> : null}</View>;
}

export function StatusPill({ status }: { status: ReportStatus }) {
  const tone = status === 'RESOLVED' ? C.organic : status === 'REJECTED' ? C.glass : status === 'PENDING' ? C.warning : C.accent;
  return <View style={[styles.pill, { backgroundColor: `${tone}18` }]}><Text style={[styles.pillText, { color: tone }]}>{statusLabel(status)}</Text></View>;
}

export function ReportCard({ report, footer, onPress }: { report: Report; footer?: React.ReactNode; onPress?: () => void }) {
  const before = report.images?.find((image) => image.type !== 'AFTER') ?? report.images?.[0];
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
      {before?.url ? <Image source={{ uri: before.url }} style={styles.reportImage} resizeMode="cover" /> : null}
      <View style={{ padding: 14 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.mono}>#{report.id.slice(0, 8)}</Text><StatusPill status={report.status} />
        </View>
        <Text style={styles.cardTitle}>{wasteLabel(report.wasteType)}</Text>
        <Text style={styles.bodyText}>{(report.description || '').split(':')[0]}</Text>
        {report.reporter?.name ? <Text style={styles.smallMuted}>Reporter: {report.reporter.name}</Text> : null}
        <Text style={styles.smallMuted}>{new Date(report.createdAt).toLocaleDateString()} · {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</Text>
        {footer ? <View style={{ marginTop: 12 }}>{footer}</View> : null}
      </View>
    </Pressable>
  );
}

export const ui = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  body: { color: C.ink, fontSize: 14, lineHeight: 20 },
  smallMuted: { color: C.muted, fontSize: 12, lineHeight: 18 },
  link: { color: C.accent, fontSize: 13, fontWeight: '700' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.paper },
  page: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 34, gap: 14 },
  eyebrow: { color: C.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.6, marginBottom: -8 },
  pageTitle: { fontSize: 28, color: C.ink, fontWeight: '900', letterSpacing: -0.6 },
  subtitle: { color: C.muted, fontSize: 13, lineHeight: 19, marginTop: -8 },
  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 14, overflow: 'hidden', marginBottom: 2 },
  button: { minHeight: 46, borderWidth: 1, borderRadius: 11, paddingHorizontal: 15, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  buttonCompact: { minHeight: 36, paddingVertical: 8, paddingHorizontal: 10 },
  buttonText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  fieldWrap: { marginBottom: 12 },
  fieldLabel: { color: C.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginBottom: 7 },
  input: { minHeight: 46, borderWidth: 1, borderColor: C.line, borderRadius: 11, backgroundColor: C.white, color: C.ink, paddingHorizontal: 13, paddingVertical: 10, fontSize: 14 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  choiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: C.line, borderRadius: 100, backgroundColor: C.white },
  choiceSelected: { backgroundColor: C.ink, borderColor: C.ink },
  choiceText: { fontSize: 12, color: C.muted, fontWeight: '600' },
  choiceTextSelected: { color: C.white },
  errorBox: { backgroundColor: '#FEE4E2', borderRadius: 10, padding: 12, borderColor: '#FDA29B', borderWidth: 1 },
  errorText: { color: '#912018', fontSize: 12, lineHeight: 18 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, backgroundColor: C.paper, padding: 24 },
  stat: { minWidth: '46%', flexGrow: 1, padding: 15, borderRadius: 13, backgroundColor: C.surface, borderColor: C.line, borderWidth: 1, gap: 7 },
  statValue: { fontSize: 25, fontWeight: '900', color: C.ink },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  sectionTitle: { color: C.ink, fontSize: 16, fontWeight: '800' },
  pill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 100, alignSelf: 'flex-start' },
  pillText: { fontSize: 10, fontWeight: '800' },
  mono: { color: C.muted, fontSize: 11, fontVariant: ['tabular-nums'] },
  cardTitle: { color: C.ink, fontSize: 15, fontWeight: '800', marginTop: 8 },
  bodyText: { color: C.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  smallMuted: { color: C.muted, fontSize: 11, marginTop: 7 },
  reportImage: { width: '100%', height: 150, backgroundColor: C.accentSoft },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
});
