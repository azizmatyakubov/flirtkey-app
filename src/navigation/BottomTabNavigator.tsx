import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

// Tab param list type
export type BottomTabParamList = {
  HomeTab: undefined;
  SettingsTab: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

// Tab bar icon component
interface TabIconProps {
  focused: boolean;
  emoji: string;
  label: string;
}

function TabIcon({ focused, emoji, label }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#666',
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="💬" label="Chats" />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="⚙️" label="Settings" />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1a1a2e',
    borderTopColor: '#333',
    borderTopWidth: 1,
    height: 70,
    paddingTop: 8,
    paddingBottom: 16,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabEmoji: {
    fontSize: 22,
    opacity: 0.6,
  },
  tabEmojiActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    color: '#666',
  },
  tabLabelActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
});
