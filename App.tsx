import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';

import { HomeScreen } from './src/screens/HomeScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { AddContactScreen } from './src/screens/AddContactScreen';
import { ContactProfileScreen } from './src/screens/ContactProfileScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ApiKeySetupScreen } from './src/screens/ApiKeySetupScreen';
import { PermissionsScreen } from './src/screens/PermissionsScreen';
import { UserProfileSetupScreen } from './src/screens/UserProfileSetupScreen';
import { ScreenshotAnalysisScreen } from './src/screens/ScreenshotAnalysisScreen';
import { ChatHistoryScreen } from './src/screens/ChatHistoryScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { PreferencesScreen } from './src/screens/PreferencesScreen';
import { AboutScreen } from './src/screens/AboutScreen';
import { CoachScreen } from './src/screens/CoachScreen';
import { ProfileOptimizerScreen } from './src/screens/ProfileOptimizerScreen';
import { TemplatesScreen } from './src/screens/TemplatesScreen';
import { MatchInsightsScreen } from './src/screens/MatchInsightsScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { BioGeneratorScreen } from './src/screens/BioGeneratorScreen';
import { OnboardingFlowScreen } from './src/screens/OnboardingFlowScreen';
import { OpenerGeneratorScreen } from './src/screens/OpenerGeneratorScreen';
import { PaywallScreen } from './src/screens/PaywallScreen';
import { PrivacyPolicyScreen } from './src/screens/PrivacyPolicyScreen';
import { QuickReplyScreen } from './src/screens/QuickReplyScreen';
import { StyleSetupScreen } from './src/screens/StyleSetupScreen';
import { TermsScreen } from './src/screens/TermsScreen';
import { RootStackParamList } from './src/types';
import { defaultScreenOptions, screenOptions, linking } from './src/constants';
import { ToastProvider } from './src/components/Toast';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { useSettingsStore } from './src/stores/settingsStore';

const ONBOARDING_COMPLETE_KEY = 'flirtkey_onboarding_complete';

// Create typed navigator
const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const { theme, isDark } = useTheme();
  const recordAppOpen = useSettingsStore((s) => s.recordAppOpen);

  useEffect(() => {
    checkOnboardingStatus();
    recordAppOpen();
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
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
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
        <Stack.Screen
          name="AddContact"
          component={AddContactScreen}
          options={screenOptions.AddContact}
        />
        <Stack.Screen
          name="ContactProfile"
          component={ContactProfileScreen}
          options={screenOptions.ContactProfile}
        />
        <Stack.Screen name="Settings" component={SettingsScreen} options={screenOptions.Settings} />
        <Stack.Screen
          name="ScreenshotAnalysis"
          component={ScreenshotAnalysisScreen}
          options={screenOptions.ScreenshotAnalysis}
        />
        <Stack.Screen
          name="ChatHistory"
          component={ChatHistoryScreen}
          options={screenOptions.ChatHistory}
        />

        {/* History Screen */}
        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />

        {/* Phase 8: Settings Screens */}
        <Stack.Screen
          name="Preferences"
          component={PreferencesScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="About"
          component={AboutScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />

        {/* New Feature Screens */}
        <Stack.Screen
          name="Coach"
          component={CoachScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="ProfileOptimizer"
          component={ProfileOptimizerScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="Templates"
          component={TemplatesScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="MatchInsights"
          component={MatchInsightsScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />

        {/* Previously unregistered screens */}
        <Stack.Screen
          name="Analytics"
          component={AnalyticsScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="BioGenerator"
          component={BioGeneratorScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="OnboardingFlow"
          component={OnboardingFlowScreen}
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="OpenerGenerator"
          component={OpenerGeneratorScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="Paywall"
          component={PaywallScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicyScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="QuickReply"
          component={QuickReplyScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="StyleSetup"
          component={StyleSetupScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="Terms"
          component={TermsScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <ThemeProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
