import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

/**
 * 6.5.5 Screen transition animations
 * Default navigation screen options for the app
 */
export const defaultScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: '#0a0a0a' },
  animation: 'slide_from_right',
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  animationDuration: 250,
};

/**
 * Modal screen options (slide up from bottom)
 */
export const modalScreenOptions: NativeStackNavigationOptions = {
  ...defaultScreenOptions,
  animation: 'slide_from_bottom',
  presentation: 'modal',
  animationDuration: 300,
};

/**
 * Fade animation screen options
 */
export const fadeScreenOptions: NativeStackNavigationOptions = {
  ...defaultScreenOptions,
  animation: 'fade',
  animationDuration: 200,
};

/**
 * Fade from bottom animation (for alerts/dialogs)
 */
export const fadeFromBottomOptions: NativeStackNavigationOptions = {
  ...defaultScreenOptions,
  animation: 'fade_from_bottom',
  animationDuration: 250,
};

/**
 * iOS-style card animation
 */
export const cardScreenOptions: NativeStackNavigationOptions = {
  ...defaultScreenOptions,
  animation: 'slide_from_right',
  animationDuration: 350,
};

/**
 * Screen-specific options with enhanced animations
 */
export const screenOptions = {
  Home: {
    ...defaultScreenOptions,
    animation: 'fade' as const,
    animationDuration: 200,
  },
  Chat: {
    ...defaultScreenOptions,
    animation: 'slide_from_right' as const,
    animationDuration: 250,
  },
  AddContact: {
    ...modalScreenOptions,
    animation: 'slide_from_bottom' as const,
    animationDuration: 300,
  },
  ContactProfile: {
    ...defaultScreenOptions,
    animation: 'slide_from_right' as const,
    animationDuration: 250,
  },
  Settings: {
    ...defaultScreenOptions,
    animation: 'slide_from_right' as const,
    animationDuration: 250,
  },
  Welcome: {
    ...fadeScreenOptions,
    gestureEnabled: false,
    animation: 'fade' as const,
    animationDuration: 400,
  },
  Onboarding: {
    ...fadeScreenOptions,
    gestureEnabled: false,
    animation: 'fade' as const,
    animationDuration: 300,
  },
  ApiKeySetup: {
    ...defaultScreenOptions,
    animation: 'slide_from_right' as const,
    animationDuration: 250,
  },
  Permissions: {
    ...defaultScreenOptions,
    animation: 'slide_from_right' as const,
    animationDuration: 250,
  },
  UserProfileSetup: {
    ...defaultScreenOptions,
    animation: 'slide_from_right' as const,
    animationDuration: 250,
  },
  ScreenshotAnalysis: {
    ...modalScreenOptions,
    animation: 'slide_from_bottom' as const,
    animationDuration: 350,
  },
  ChatHistory: {
    ...defaultScreenOptions,
    animation: 'slide_from_right' as const,
    animationDuration: 250,
  },
} as const;

/**
 * Screen names as constants to avoid typos
 */
export const SCREENS = {
  HOME: 'Home',
  CHAT: 'Chat',
  ADD_GIRL: 'AddContact',
  GIRL_PROFILE: 'ContactProfile',
  SETTINGS: 'Settings',
  WELCOME: 'Welcome',
  ONBOARDING: 'Onboarding',
  API_KEY_SETUP: 'ApiKeySetup',
  PERMISSIONS: 'Permissions',
  USER_PROFILE_SETUP: 'UserProfileSetup',
  SCREENSHOT_ANALYSIS: 'ScreenshotAnalysis',
  CHAT_HISTORY: 'ChatHistory',
} as const;
