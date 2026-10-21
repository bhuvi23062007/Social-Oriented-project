import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../AuthContext';
import { Button, C, Card, Page, ui } from '../components/ui';
import type { Role } from '../types';

type MenuItem = { title: string; subtitle: string; route?: string; icon: string };

const menuByRole: Record<Role, MenuItem[]> = {
  CITIZEN: [
    { title: 'Credits', subtitle: 'View your points and transaction history.', route: 'Credits', icon: '⭐' },
    { title: 'Notifications', subtitle: 'Updates about your reports and rewards.', route: 'Notifications', icon: '🔔' },
    { title: 'Learn', subtitle: 'Watch waste-management learning videos.', route: 'Learning', icon: '🎓' },
  ],
  CLEANING_STAFF: [
    { title: 'Credits', subtitle: 'View verified cleaning credits and history.', route: 'Credits', icon: '⭐' },
    { title: 'Learn', subtitle: 'Watch waste-management learning videos.', route: 'Learning', icon: '🎓' },
  ],
  ADMIN: [
    { title: 'Users', subtitle: 'Review registered citizens and cleaning staff.', route: 'Users', icon: '👥' },
    { title: 'Messages', subtitle: 'Send cleanup instructions to cleaners.', route: 'Messages', icon: '💬' },
    { title: 'Notifications', subtitle: 'View notifications for your account.', route: 'Notifications', icon: '🔔' },
    { title: 'Learn', subtitle: 'Waste-management learning videos.', route: 'Learning', icon: '🎓' },
  ],
};

export function MoreScreen({ navigation, role }: { navigation: any; role: Role }) {
  const { auth, logout } = useAuth();
  const items = menuByRole[role];
  return (
    <Page eyebrow="CleanMaxx" title="More" subtitle="Additional tools and account options.">
      <Card style={s.profile}>
        <View style={s.avatar}><Text style={s.avatarText}>{(auth?.name?.trim().charAt(0) || 'U').toUpperCase()}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{auth?.name ?? 'CleanMaxx user'}</Text>
          <Text style={ui.smallMuted}>{auth?.email ?? ''}</Text>
          <Text style={s.role}>{role.replace('_', ' ')}</Text>
        </View>
      </Card>
      {items.map((item) => (
        <Pressable key={item.title} onPress={() => item.route && navigation.navigate(item.route)}>
          <Card style={s.menuItem}>
            <Text style={s.menuIcon}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.menuTitle}>{item.title}</Text>
              <Text style={ui.smallMuted}>{item.subtitle}</Text>
            </View>
            <Text style={s.chevron}>›</Text>
          </Card>
        </Pressable>
      ))}
      <View style={{ height: 4 }} />
      <Button
        title="Log out"
        kind="danger"
        onPress={() => Alert.alert('Log out?', 'You will return to the CleanMaxx welcome screen.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log out', style: 'destructive', onPress: () => { void logout(); } },
        ])}
      />
      <Text style={s.footer}>CleanMaxx · Community-driven cleanliness</Text>
    </Page>
  );
}

const s = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, marginBottom: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  menuIcon: { fontSize: 23, width: 30, textAlign: 'center' },
  menuTitle: { color: C.ink, fontSize: 14, fontWeight: '800', marginBottom: 3 },
  chevron: { color: C.muted, fontSize: 25, paddingHorizontal: 5 },
  avatar: { width: 48, height: 48, borderRadius: 15, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: C.white, fontSize: 20, fontWeight: '900' },
  name: { color: C.ink, fontSize: 15, fontWeight: '900' },
  role: { color: C.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1, marginTop: 5 },
  footer: { color: C.muted, fontSize: 11, textAlign: 'center', marginTop: 12 },
});
