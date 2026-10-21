import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Animated, StatusBar, Text } from 'react-native';
import { useEffect, useRef } from 'react';

import { AuthProvider, useAuth } from './src/AuthContext';
import { C, Loading } from './src/components/ui';
import { WelcomeScreen, LoginScreen, RegisterScreen } from './src/screens/AuthScreens';
import {
  CitizenDashboardScreen,
  ReportWasteScreen,
  MyReportsScreen,
  CreditsScreen,
  NotificationsScreen,
  RewardsScreen,
  LearningScreen,
} from './src/screens/CitizenScreens';
import {
  CleanerDashboardScreen,
  CleanerTasksScreen,
  UrgentRequestsScreen,
  CleanerMessagesScreen,
} from './src/screens/CleanerScreens';
import {
  AdminOverviewScreen,
  VerifyReportsScreen,
  AllReportsScreen,
  CleaningTeamsScreen,
  AdminUsersScreen,
  AdminMessagesScreen,
} from './src/screens/AdminScreens';
import { MoreScreen } from './src/screens/MoreScreens';
import ActiveTaskScreen from './src/screens/ActiveTaskScreen';

const AuthStack = createNativeStackNavigator();
const CitizenStack = createNativeStackNavigator();
const CleanerStack = createNativeStackNavigator();
const AdminStack = createNativeStackNavigator();
const CitizenTab = createBottomTabNavigator();
const CleanerTab = createBottomTabNavigator();
const AdminTab = createBottomTabNavigator();

const stackOptions = {
  headerStyle: { backgroundColor: C.paper },
  headerTintColor: C.ink,
  headerTitleStyle: { fontWeight: '800' as const },
  contentStyle: { backgroundColor: C.paper },
  animation: 'slide_from_right' as const,
};

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  const scale = useRef(new Animated.Value(focused ? 1 : 0.88)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: focused ? 1 : 0.88, useNativeDriver: true, damping: 14, stiffness: 180 }).start();
  }, [focused, scale]);
  return <Animated.Text style={{ fontSize: focused ? 20 : 18, opacity: focused ? 1 : 0.62, transform: [{ scale }] }}>{emoji}</Animated.Text>;
}

function PublicNavigator() {
  return (
    <AuthStack.Navigator screenOptions={stackOptions}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ title: 'Log in' }} />
      <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create account' }} />
    </AuthStack.Navigator>
  );
}

function CitizenMoreTab(props: any) {
  return <MoreScreen {...props} role="CITIZEN" />;
}
function CleanerMoreTab(props: any) {
  return <MoreScreen {...props} role="CLEANING_STAFF" />;
}
function AdminMoreTab(props: any) {
  return <MoreScreen {...props} role="ADMIN" />;
}

function CitizenTabs() {
  return (
    <CitizenTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { backgroundColor: C.white, borderTopColor: C.line, height: 62, paddingTop: 5, paddingBottom: 5 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      <CitizenTab.Screen name="Dashboard" component={CitizenDashboardScreen} options={{ tabBarLabel: 'Home', tabBarIcon: ({ focused }) => <TabIcon emoji="⌂" focused={focused} /> }} />
      <CitizenTab.Screen name="Report Waste" component={ReportWasteScreen} options={{ tabBarLabel: 'Report', tabBarIcon: ({ focused }) => <TabIcon emoji="＋" focused={focused} /> }} />
      <CitizenTab.Screen name="My Reports" component={MyReportsScreen} options={{ tabBarLabel: 'Reports', tabBarIcon: ({ focused }) => <TabIcon emoji="▤" focused={focused} /> }} />
      <CitizenTab.Screen name="Rewards" component={RewardsScreen} options={{ tabBarLabel: 'Rewards', tabBarIcon: ({ focused }) => <TabIcon emoji="🏆" focused={focused} /> }} />
      <CitizenTab.Screen name="More" component={CitizenMoreTab} options={{ tabBarLabel: 'More', tabBarIcon: ({ focused }) => <TabIcon emoji="☰" focused={focused} /> }} />
    </CitizenTab.Navigator>
  );
}

function CitizenNavigator() {
  return (
    <CitizenStack.Navigator screenOptions={stackOptions}>
      <CitizenStack.Screen name="Tabs" component={CitizenTabs} options={{ headerShown: false }} />
      <CitizenStack.Screen name="Credits" component={CreditsScreen} options={{ title: 'Credits & Rewards' }} />
      <CitizenStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <CitizenStack.Screen name="Learning" component={LearningScreen} options={{ title: 'Learn' }} />
    </CitizenStack.Navigator>
  );
}

function CleanerTabs() {
  return (
    <CleanerTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { backgroundColor: C.white, borderTopColor: C.line, height: 62, paddingTop: 5, paddingBottom: 5 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      <CleanerTab.Screen name="Dashboard" component={CleanerDashboardScreen} options={{ tabBarLabel: 'Home', tabBarIcon: ({ focused }) => <TabIcon emoji="⌂" focused={focused} /> }} />
      <CleanerTab.Screen name="My Tasks" component={CleanerTasksScreen} options={{ tabBarLabel: 'Tasks', tabBarIcon: ({ focused }) => <TabIcon emoji="▤" focused={focused} /> }} />
      <CleanerTab.Screen name="Urgent Requests" component={UrgentRequestsScreen} options={{ tabBarLabel: 'Nearby', tabBarIcon: ({ focused }) => <TabIcon emoji="⚠" focused={focused} /> }} />
      <CleanerTab.Screen name="Messages" component={CleanerMessagesScreen} options={{ tabBarLabel: 'Messages', tabBarIcon: ({ focused }) => <TabIcon emoji="✉" focused={focused} /> }} />
      <CleanerTab.Screen name="More" component={CleanerMoreTab} options={{ tabBarLabel: 'More', tabBarIcon: ({ focused }) => <TabIcon emoji="☰" focused={focused} /> }} />
    </CleanerTab.Navigator>
  );
}

function CleanerCreditsScreen() {
  return <CreditsScreen cleaner />;
}

function CleanerNavigator() {
  return (
    <CleanerStack.Navigator screenOptions={stackOptions}>
      <CleanerStack.Screen name="Tabs" component={CleanerTabs} options={{ headerShown: false }} />
      <CleanerStack.Screen name="ActiveTask" component={ActiveTaskScreen} options={{ headerShown: false, gestureEnabled: false }} />
      <CleanerStack.Screen name="Credits" component={CleanerCreditsScreen} options={{ title: 'Credits' }} />
      <CleanerStack.Screen name="Learning" component={LearningScreen} options={{ title: 'Learn' }} />
    </CleanerStack.Navigator>
  );
}

function AdminTabs() {
  return (
    <AdminTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { backgroundColor: C.white, borderTopColor: C.line, height: 62, paddingTop: 5, paddingBottom: 5 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      <AdminTab.Screen name="Overview" component={AdminOverviewScreen} options={{ tabBarLabel: 'Overview', tabBarIcon: ({ focused }) => <TabIcon emoji="⌂" focused={focused} /> }} />
      <AdminTab.Screen name="Verify Reports" component={VerifyReportsScreen} options={{ tabBarLabel: 'Verify', tabBarIcon: ({ focused }) => <TabIcon emoji="✓" focused={focused} /> }} />
      <AdminTab.Screen name="All Reports" component={AllReportsScreen} options={{ tabBarLabel: 'Reports', tabBarIcon: ({ focused }) => <TabIcon emoji="▤" focused={focused} /> }} />
      <AdminTab.Screen name="Cleaning Teams" component={CleaningTeamsScreen} options={{ tabBarLabel: 'Teams', tabBarIcon: ({ focused }) => <TabIcon emoji="♧" focused={focused} /> }} />
      <AdminTab.Screen name="More" component={AdminMoreTab} options={{ tabBarLabel: 'More', tabBarIcon: ({ focused }) => <TabIcon emoji="☰" focused={focused} /> }} />
    </AdminTab.Navigator>
  );
}

function AdminNavigator() {
  return (
    <AdminStack.Navigator screenOptions={stackOptions}>
      <AdminStack.Screen name="Tabs" component={AdminTabs} options={{ headerShown: false }} />
      <AdminStack.Screen name="Users" component={AdminUsersScreen} options={{ title: 'Users' }} />
      <AdminStack.Screen name="Messages" component={AdminMessagesScreen} options={{ title: 'Messages' }} />
      <AdminStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <AdminStack.Screen name="Learning" component={LearningScreen} options={{ title: 'Learn' }} />
    </AdminStack.Navigator>
  );
}

function RootNavigation() {
  const { auth, ready } = useAuth();
  if (!ready) return <Loading label="Opening CleanMaxx…" />;

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor={C.paper} />
      {!auth ? <PublicNavigator /> : auth.role === 'ADMIN' ? <AdminNavigator /> : auth.role === 'CLEANING_STAFF' ? <CleanerNavigator /> : <CitizenNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
