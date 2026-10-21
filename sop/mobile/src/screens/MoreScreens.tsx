import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../AuthContext';
import { Button, C, Card, Page, PulseDot, ui } from '../components/ui';
import type { Role } from '../types';

type MenuItem = { title: string; subtitle: string; route?: string; icon: string };

const menuByRole: Record<Role, MenuItem[]> = {
  CITIZEN: [
    { title: 'Credits & Wallet', subtitle: 'View your eco-tier, points & transaction ledger.', route: 'Credits', icon: '⭐' },
    { title: 'Notifications', subtitle: 'Live updates on your reports and rewards.', route: 'Notifications', icon: '🔔' },
    { title: 'Knowledge Hub', subtitle: 'Watch short masterclasses on waste sorting.', route: 'Learning', icon: '🎓' },
  ],
  CLEANING_STAFF: [
    { title: 'Cleaner Wallet', subtitle: 'View verified pickup credits & ledger.', route: 'Credits', icon: '⭐' },
    { title: 'Redeem Rewards', subtitle: 'Redeem your earned points for eco-rewards.', route: 'Rewards', icon: '🏆' },
    { title: 'Notifications', subtitle: 'Nearby request alerts and verification updates.', route: 'Notifications', icon: '🔔' },
    { title: 'Knowledge Hub', subtitle: 'Watch short masterclasses on waste sorting.', route: 'Learning', icon: '🎓' },
  ],
  ADMIN: [
    { title: 'Platform Users', subtitle: 'Review registered citizens and cleaning staff.', route: 'Users', icon: '👥' },
    { title: 'Dispatch Messages', subtitle: 'Send priority cleanup instructions to cleaners.', route: 'Messages', icon: '💬' },
    { title: 'Notifications', subtitle: 'System alerts for your admin account.', route: 'Notifications', icon: '🔔' },
    { title: 'Knowledge Hub', subtitle: 'Waste-management learning videos.', route: 'Learning', icon: '🎓' },
  ],
};

export function MoreScreen({ navigation, role }: { navigation: any; role: Role }) {
  const { auth, logout } = useAuth();
  const items = menuByRole[role];

  return (
    <Page eyebrow="Account & Tools" title="More" subtitle="Manage your CleanMaxx profile and tools.">
      <Card dark style={s.profile}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{(auth?.name?.trim().charAt(0) || 'U').toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{auth?.name ?? 'CleanMaxx User'}</Text>
          <Text style={s.email}>{auth?.email ?? ''}</Text>
          <View style={s.rolePill}>
            <PulseDot color="#34D399" />
            <Text style={s.role}>{role.replace('_', ' ')}</Text>
          </View>
        </View>
      </Card>

      {items.map((item) => (
        <Pressable key={item.title} onPress={() => item.route && navigation.navigate(item.route)}>
          <Card style={s.menuItem}>
            <View style={s.iconWrap}>
              <Text style={s.menuIcon}>{item.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.menuTitle}>{item.title}</Text>
              <Text style={ui.smallMuted}>{item.subtitle}</Text>
            </View>
            <Text style={s.chevron}>›</Text>
          </Card>
        </Pressable>
      ))}

      <View style={{ height: 6 }} />
      <Button
        title="Sign Out"
        kind="danger"
        onPress={() =>
          Alert.alert('Sign out?', 'You will return to the CleanMaxx welcome screen.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Sign out',
              style: 'destructive',
              onPress: () => {
                void logout();
              },
            },
          ])
        }
      />
      <Text style={s.footer}>CleanMaxx OS · OpenStreetMap Telemetry</Text>
    </Page>
  );
}

const s = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: C.white, fontSize: 22, fontWeight: '900' },
  name: { color: C.white, fontSize: 17, fontWeight: '900' },
  email: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 8,
  },
  role: { color: '#34D399', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 15 },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: C.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: { fontSize: 20 },
  menuTitle: { color: C.ink, fontSize: 15, fontWeight: '800', marginBottom: 2 },
  chevron: { color: C.muted, fontSize: 24, fontWeight: '700', paddingHorizontal: 4 },
  footer: { color: C.muted, fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 10 },
});