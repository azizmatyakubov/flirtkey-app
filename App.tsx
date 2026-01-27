import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { HomeScreen } from './src/screens/HomeScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { AddGirlScreen } from './src/screens/AddGirlScreen';
import { GirlProfileScreen } from './src/screens/GirlProfileScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ApiKeySetupScreen } from './src/screens/ApiKeySetupScreen';
import { PermissionsScreen } from './src/screens/PermissionsScreen';
import { UserProfileSetupScreen } from './src/screens/UserProfileSetupScreen';
import { RootStackParamList } from './src/types';
import { defaultScreenOptions, screenOptions, linking } from './src/constants';
import { darkColors } from './src/constants/theme';

const ONBOARDING_COMPLETE_KEY = 'flirtkey_onboarding_complete';

// Create typed navigator
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const onboardingComplete = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
      setIsFirstLaunch(onboardingComplete !== 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setIsFirstLaunch(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={darkColors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName={isFirstLaunch ? 'Welcome' : 'Home'}
        screenOptions={defaultScreenOptions}
      >
        {/* Onboarding Flow */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={screenOptions.Welcome} />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={screenOptions.Onboarding}
        />
        <Stack.Screen
          name="ApiKeySetup"
          component={ApiKeySetupScreen}
          options={screenOptions.ApiKeySetup}
        />
        <Stack.Screen
          name="Permissions"
          component={PermissionsScreen}
          options={screenOptions.Permissions}
        />
        <Stack.Screen
          name="UserProfileSetup"
          component={UserProfileSetupScreen}
          options={screenOptions.UserProfileSetup}
        />

        {/* Main App Flow */}
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: darkColors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
