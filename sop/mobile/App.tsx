import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/AuthContext';
import { C, Loading } from './src/components/ui';

import {
  WelcomeScreen,
  LoginScreen,
  RegisterScreen,
} from './src/screens/AuthScreens';

import {
  CitizenDashboardScreen,
  ReportWasteScreen,
  MyReportsScreen,
  CreditsScreen,
  NotificationsScreen,
  RewardsScreen,
  LearningScreen,
} from './src/screens/CitizenScreens';

import { MoreScreen } from './src/screens/MoreScreens';

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

import ActiveTaskScreen from './src/screens/ActiveTaskScreen';

const AuthStack = createNativeStackNavigator();
const CitizenStack = createNativeStackNavigator();
const CleanerStack = createNativeStackNavigator();
const AdminStack = createNativeStackNavigator();

const CitizenTab = createBottomTabNavigator();
const CleanerTab = createBottomTabNavigator();
const AdminTab = createBottomTabNavigator();

type IconName = keyof typeof Ionicons.glyphMap;

function TabIcon({
  focused,
  color,
  size,
  name,
  activeName,
}: {
  focused: boolean;
  color: string;
  size: number;
  name: IconName;
  activeName: IconName;
}) {
  const scale = useRef(new Animated.Value(focused ? 1 : 0.92)).current;
  const opacity = useRef(new Animated.Value(focused ? 1 : 0.72)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1 : 0.92,
        useNativeDriver: true,
        speed: 22,
        bounciness: 5,
      }),
      Animated.timing(opacity, {
        toValue: focused ? 1 : 0.72,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, opacity, scale]);

  return (
    <Animated.View
      style={[
        styles.tabIcon,
        {
          transform: [{ scale }],
          opacity,
        },
      ]}
    >
      <Ionicons
        name={focused ? activeName : name}
        size={size}
        color={color}
      />
    </Animated.View>
  );
}

function PublicNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen
        name="Welcome"
        component={WelcomeScreen}
      />
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
      />
      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
      />
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

const citizenTabs = {
  Dashboard: {
    label: 'Home',
    icon: 'home-outline' as IconName,
    activeIcon: 'home' as IconName,
  },
  Report: {
    label: 'Report',
    icon: 'add-circle-outline' as IconName,
    activeIcon: 'add-circle' as IconName,
  },
  Reports: {
    label: 'Reports',
    icon: 'document-text-outline' as IconName,
    activeIcon: 'document-text' as IconName,
  },
  Rewards: {
    label: 'Rewards',
    icon: 'trophy-outline' as IconName,
    activeIcon: 'trophy' as IconName,
  },
  More: {
    label: 'More',
    icon: 'menu-outline' as IconName,
    activeIcon: 'menu' as IconName,
  },
};

function CitizenTabs() {
  return (
    <CitizenTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <CitizenTab.Screen
        name="Dashboard"
        component={CitizenDashboardScreen}
        options={{
          tabBarLabel: citizenTabs.Dashboard.label,
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              name={citizenTabs.Dashboard.icon}
              activeName={citizenTabs.Dashboard.activeIcon}
            />
          ),
        }}
      />

      <CitizenTab.Screen
        name="Report Waste"
        component={ReportWasteScreen}
        options={{
          tabBarLabel: citizenTabs.Report.label,
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              name={citizenTabs.Report.icon}
              activeName={citizenTabs.Report.activeIcon}
            />
          ),
        }}
      />

      <CitizenTab.Screen
        name="My Reports"
        component={MyReportsScreen}
        options={{
          tabBarLabel: citizenTabs.Reports.label,
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              name={citizenTabs.Reports.icon}
              activeName={citizenTabs.Reports.activeIcon}
            />
          ),
        }}
      />

      <CitizenTab.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{
          tabBarLabel: citizenTabs.Rewards.label,
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              name={citizenTabs.Rewards.icon}
              activeName={citizenTabs.Rewards.activeIcon}
            />
          ),
        }}
      />

      <CitizenTab.Screen
        name="More"
        component={CitizenMoreTab}
        options={{
          tabBarLabel: citizenTabs.More.label,
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              name={citizenTabs.More.icon}
              activeName={citizenTabs.More.activeIcon}
            />
          ),
        }}
      />
    </CitizenTab.Navigator>
  );
}

function CitizenNavigator() {
  return (
    <CitizenStack.Navigator
      screenOptions={{
        headerTintColor: C.ink,
        headerStyle: {
          backgroundColor: C.paper,
        },
        headerTitleStyle: {
          fontWeight: '800',
        },
        contentStyle: {
          backgroundColor: C.paper,
        },
      }}
    >
      <CitizenStack.Screen
        name="Tabs"
        component={CitizenTabs}
        options={{ headerShown: false }}
      />

      <CitizenStack.Screen
        name="Credits"
        component={CreditsScreen}
        options={{ title: 'Credits' }}
      />

      <CitizenStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />

      <CitizenStack.Screen
        name="Learning"
        component={LearningScreen}
        options={{ title: 'Learning' }}
      />
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
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <CleanerTab.Screen
        name="Dashboard"
        component={CleanerDashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              name="home-outline"
              activeName="home"
            />
          ),
        }}
      />

      <CleanerTab.Screen
        name="My Tasks"
        component={CleanerTasksScreen}
        options={{
          tabBarLabel: 'Tasks',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              name="checkbox-outline"
              activeName="checkbox"
            />
          ),
        }}
      />

      <CleanerTab.Screen
        name="Urgent Requests"
        component={UrgentRequestsScreen}
        options={{
          tabBarLabel: 'Nearby',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              name="navigate-outline"
              activeName="navigate"
            />
          ),
        }}
      />

      <CleanerTab.Screen
        name="Messages"
        component={CleanerMessagesScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              name="chatbubble-outline"
              activeName="chatbubble"
            />
          ),
        }}
      />

      <CleanerTab.Screen
        name="More"
        component={CleanerMoreTab}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              name="menu-outline"
              activeName="menu"
            />
          ),
        }}
      />
    </CleanerTab.Navigator>
  );
}

function CleanerNavigator() {
  return (
    <CleanerStack.Navigator
      screenOptions={{
        headerTintColor: C.ink,
        headerStyle: {
          backgroundColor: C.paper,
        },
        headerTitleStyle: {
          fontWeight: '800',
        },
        contentStyle: {
          backgroundColor: C.paper,
        },
      }}
    >
      <CleanerStack.Screen
        name="Tabs"
        component={CleanerTabs}
        options={{ headerShown: false }}
      />

      <CleanerStack.Screen
        name="ActiveTask"
        component={ActiveTaskScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
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
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <AdminTab.Screen
        name="Overview"
        component={AdminOverviewScreen}
        options={{
          tabBarLabel: 'Overview',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              name="grid-outline"
              activeName="grid"
            />
          ),
        }}
      />

      <AdminTab.Screen
        name="Verify Reports"
        component={VerifyReportsScreen}
        options={{
          tabBarLabel: 'Verify',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              name="shield-checkmark-outline"
              activeName="shield-checkmark"
            />
          ),
        }}
      />

      <AdminTab.Screen
        name="All Reports"
        component={AllReportsScreen}
        options={{
          tabBarLabel: 'Reports',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              name="document-text-outline"
              activeName="document-text"
            />
          ),
        }}
      />

      <AdminTab.Screen
        name="Cleaning Teams"
        component={CleaningTeamsScreen}
        options={{
          tabBarLabel: 'Teams',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              name="people-outline"
              activeName="people"
            />
          ),
        }}
      />

      <AdminTab.Screen
        name="More"
        component={AdminMoreTab}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              name="menu-outline"
              activeName="menu"
            />
          ),
        }}
      />
    </AdminTab.Navigator>
  );
}

function AdminNavigator() {
  return (
    <AdminStack.Navigator
      screenOptions={{
        headerTintColor: C.ink,
        headerStyle: {
          backgroundColor: C.paper,
        },
        headerTitleStyle: {
          fontWeight: '800',
        },
        contentStyle: {
          backgroundColor: C.paper,
        },
      }}
    >
      <AdminStack.Screen
        name="Tabs"
        component={AdminTabs}
        options={{ headerShown: false }}
      />

      <AdminStack.Screen
        name="Users"
        component={AdminUsersScreen}
        options={{ title: 'Users' }}
      />

      <AdminStack.Screen
        name="Messages"
        component={AdminMessagesScreen}
        options={{ title: 'Messages' }}
      />

      <AdminStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />

      <AdminStack.Screen
        name="Learning"
        component={LearningScreen}
        options={{ title: 'Learning' }}
      />
    </AdminStack.Navigator>
  );
}

function RootNavigation() {
  const { auth, ready } = useAuth();

  if (!ready) {
    return <Loading label="Opening CleanMaxx…" />;
  }

  return (
    <NavigationContainer>
      {!auth ? (
        <PublicNavigator />
      ) : auth.role === 'ADMIN' ? (
        <AdminNavigator />
      ) : auth.role === 'CLEANING_STAFF' ? (
        <CleanerNavigator />
      ) : (
        <CitizenNavigator />
      )}
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

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: C.white,
    borderTopColor: C.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 68,
    paddingTop: 6,
    paddingBottom: 7,
    elevation: 0,
    shadowOpacity: 0,
  },

  tabItem: {
    paddingVertical: 1,
  },

  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.1,
  },

  tabIcon: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});