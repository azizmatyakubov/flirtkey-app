import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { darkColors, accentColors, fontSizes, spacing, borderRadius } from '../constants/theme';

// Tab param list type
export type BottomTabParamList = {
  HomeTab: undefined;
  SettingsTab: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

// Tab bar icon component
interface TabIconProps {
  focused: boolean;
  iconName: keyof typeof Ionicons.glyphName;
  iconNameOutline: keyof typeof Ionicons.glyphName;
  label: string;
}

function TabIcon({ focused, iconName, iconNameOutline, label }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      <Ionicons
        name={(focused ? iconName : iconNameOutline) as any}
        size={24}
        color={focused ? accentColors.coral : darkColors.textTertiary}
      />
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
        tabBarActiveTintColor: accentColors.coral,
        tabBarInactiveTintColor: darkColors.textTertiary,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              iconName={'chatbubbles' as any}
              iconNameOutline={'chatbubbles-outline' as any}
              label="Chats"
            />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              iconName={'settings' as any}
              iconNameOutline={'settings-outline' as any}
              label="Settings"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: darkColors.surface,
    borderTopColor: darkColors.border,
    borderTopWidth: 1,
    height: 70,
    paddingTop: 8,
    paddingBottom: 16,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    color: darkColors.textTertiary,
  },
  tabLabelActive: {
    color: accentColors.coral,
    fontWeight: '600',
  },
});
