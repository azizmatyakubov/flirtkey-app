import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from './src/screens/HomeScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { AddGirlScreen } from './src/screens/AddGirlScreen';
import { GirlProfileScreen } from './src/screens/GirlProfileScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { RootStackParamList } from './src/types';
import { defaultScreenOptions, screenOptions, SCREENS, linking } from './src/constants';

// Create typed navigator
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer linking={linking}>
      <StatusBar style="light" />
      <Stack.Navigator initialRouteName={SCREENS.HOME} screenOptions={defaultScreenOptions}>
        <Stack.Screen name="Home" component={HomeScreen} options={screenOptions.Home} />
        <Stack.Screen name="Chat" component={ChatScreen} options={screenOptions.Chat} />
        <Stack.Screen name="AddGirl" component={AddGirlScreen} options={screenOptions.AddGirl} />
        <Stack.Screen
          name="GirlProfile"
          component={GirlProfileScreen}
          options={screenOptions.GirlProfile}
        />
        <Stack.Screen name="Settings" component={SettingsScreen} options={screenOptions.Settings} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
